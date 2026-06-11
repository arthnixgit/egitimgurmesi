import { AuditActorType } from "@ega/db";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { execFileSync } from "node:child_process";
import { PrismaService } from "../database/prisma.service";
import type { AuthenticatedRequestContext } from "../auth/auth.types";
import { TriggerDeploymentDto } from "./dto/trigger-deployment.dto";

type GitHubCommitResponse = {
  sha: string;
  html_url?: string;
  commit?: {
    message?: string;
    author?: {
      name?: string;
      date?: string;
    };
  };
};

type GitHubWorkflowRunsResponse = {
  workflow_runs?: Array<{
    id: number;
    name: string | null;
    head_branch: string | null;
    head_sha: string;
    status: string | null;
    conclusion: string | null;
    html_url: string;
    created_at: string;
    updated_at: string;
  }>;
};

@Injectable()
export class AdminDeployService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus() {
    const config = getDeployConfig();
    const missingConfig = getMissingConfig(config);
    const currentVersion = getCurrentVersion();

    let latestCommit: ReturnType<typeof mapCommit> | null = null;
    let recentRuns: ReturnType<typeof mapWorkflowRun>[] = [];
    let githubError: string | null = null;

    if (missingConfig.length === 0) {
      try {
        const [commit, runs] = await Promise.all([
          githubRequest<GitHubCommitResponse>(
            config,
            `/repos/${config.repository}/commits/${encodeURIComponent(config.branch)}`
          ),
          githubRequest<GitHubWorkflowRunsResponse>(
            config,
            `/repos/${config.repository}/actions/workflows/${encodeURIComponent(
              config.workflowId
            )}/runs?event=workflow_dispatch&branch=${encodeURIComponent(config.branch)}&per_page=5`
          )
        ]);

        latestCommit = mapCommit(commit);
        recentRuns = (runs.workflow_runs ?? []).map(mapWorkflowRun);
      } catch (error) {
        githubError = error instanceof Error ? error.message : "GitHub status could not be read.";
      }
    }

    return {
      enabled: config.enabled,
      canTrigger: config.enabled && missingConfig.length === 0 && !githubError,
      missingConfig,
      currentVersion,
      github: {
        repository: config.repository || null,
        branch: config.branch,
        workflowId: config.workflowId,
        latestCommit,
        recentRuns,
        error: githubError
      },
      updateAvailable:
        Boolean(latestCommit?.sha && currentVersion.sha) &&
        latestCommit?.sha !== currentVersion.sha,
      checkedAt: new Date().toISOString()
    };
  }

  async triggerDeployment(dto: TriggerDeploymentDto, auth: AuthenticatedRequestContext) {
    const config = getDeployConfig();
    const missingConfig = getMissingConfig(config);

    if (!config.enabled) {
      throw new ServiceUnavailableException("Deployment trigger is disabled.");
    }

    if (missingConfig.length > 0) {
      throw new ServiceUnavailableException(
        `Deployment is not configured: ${missingConfig.join(", ")}.`
      );
    }

    const ref = dto.ref?.trim() || config.branch;

    await githubRequest<void>(
      config,
      `/repos/${config.repository}/actions/workflows/${encodeURIComponent(
        config.workflowId
      )}/dispatches`,
      {
        method: "POST",
        body: JSON.stringify({
          ref: config.branch,
          inputs: {
            ref,
            run_migrations: "true",
            restart_services: "true"
          }
        })
      }
    );

    await this.prisma.auditLog.create({
      data: {
        actorType: AuditActorType.STAFF_USER,
        staffUserId: auth.actorId,
        action: "deployment.triggered",
        entityType: "deployment",
        entityId: ref,
        summary: `GitHub deployment workflow triggered for ${ref}.`,
        metadata: {
          repository: config.repository,
          workflowId: config.workflowId,
          branch: config.branch,
          ref
        }
      }
    });

    return {
      status: "queued",
      repository: config.repository,
      workflowId: config.workflowId,
      branch: config.branch,
      ref,
      queuedAt: new Date().toISOString()
    };
  }
}

function getDeployConfig() {
  const repository =
    process.env.DEPLOY_GITHUB_REPOSITORY?.trim() ||
    process.env.GITHUB_REPOSITORY?.trim() ||
    "";

  return {
    enabled: process.env.DEPLOY_ENABLED === "true",
    token: process.env.DEPLOY_GITHUB_TOKEN?.trim() || "",
    repository,
    branch: process.env.DEPLOY_GITHUB_BRANCH?.trim() || "production",
    workflowId: process.env.DEPLOY_GITHUB_WORKFLOW_ID?.trim() || "deploy-vds.yml"
  };
}

function getMissingConfig(config: ReturnType<typeof getDeployConfig>) {
  const missing: string[] = [];

  if (!config.repository) {
    missing.push("DEPLOY_GITHUB_REPOSITORY");
  }

  if (!config.token) {
    missing.push("DEPLOY_GITHUB_TOKEN");
  }

  if (!config.branch) {
    missing.push("DEPLOY_GITHUB_BRANCH");
  }

  if (!config.workflowId) {
    missing.push("DEPLOY_GITHUB_WORKFLOW_ID");
  }

  return missing;
}

function getCurrentVersion() {
  const envSha = process.env.APP_GIT_SHA?.trim();
  const envBranch = process.env.APP_GIT_BRANCH?.trim();

  return {
    sha: envSha || readGitValue(["rev-parse", "HEAD"]) || null,
    shortSha:
      (envSha ? envSha.slice(0, 7) : null) ||
      readGitValue(["rev-parse", "--short", "HEAD"]) ||
      null,
    branch:
      envBranch ||
      readGitValue(["rev-parse", "--abbrev-ref", "HEAD"]) ||
      null
  };
}

function readGitValue(args: string[]) {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

async function githubRequest<T>(
  config: ReturnType<typeof getDeployConfig>,
  path: string,
  init: RequestInit = {}
) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {})
    }
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw new Error(getGithubConnectionErrorMessage(response.status));
  }

  return (await response.json()) as T;
}

function getGithubConnectionErrorMessage(status: number) {
  if (status === 401 || status === 403) {
    return "GitHub bağlantısı doğrulanamadı. Token, repository ve workflow yetkilerini kontrol edin.";
  }

  if (status === 404) {
    return "GitHub repository, branch veya workflow bulunamadı. Yayın ayarlarını kontrol edin.";
  }

  if (status >= 500) {
    return "GitHub servisinden geçici yanıt alınamadı. Bir süre sonra tekrar deneyin.";
  }

  return "GitHub bağlantısı kontrol edilemedi. Yayın ayarlarını gözden geçirin.";
}

function mapCommit(commit: GitHubCommitResponse) {
  return {
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    message: commit.commit?.message?.split("\n")[0] ?? "",
    authorName: commit.commit?.author?.name ?? null,
    authoredAt: commit.commit?.author?.date ?? null,
    url: commit.html_url ?? null
  };
}

function mapWorkflowRun(run: NonNullable<GitHubWorkflowRunsResponse["workflow_runs"]>[number]) {
  return {
    id: run.id,
    name: run.name,
    branch: run.head_branch,
    sha: run.head_sha,
    shortSha: run.head_sha.slice(0, 7),
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
    createdAt: run.created_at,
    updatedAt: run.updated_at
  };
}

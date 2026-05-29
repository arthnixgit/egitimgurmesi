import { requestWithStaffToken } from "./auth-client";

export type DeploymentStatus = {
  enabled: boolean;
  canTrigger: boolean;
  missingConfig: string[];
  currentVersion: {
    sha: string | null;
    shortSha: string | null;
    branch: string | null;
  };
  github: {
    repository: string | null;
    branch: string;
    workflowId: string;
    latestCommit: {
      sha: string;
      shortSha: string;
      message: string;
      authorName: string | null;
      authoredAt: string | null;
      url: string | null;
    } | null;
    recentRuns: Array<{
      id: number;
      name: string | null;
      branch: string | null;
      sha: string;
      shortSha: string;
      status: string | null;
      conclusion: string | null;
      url: string;
      createdAt: string;
      updatedAt: string;
    }>;
    error: string | null;
  };
  updateAvailable: boolean;
  checkedAt: string;
};

export type TriggerDeploymentResponse = {
  status: "queued";
  repository: string;
  workflowId: string;
  branch: string;
  ref: string;
  queuedAt: string;
};

export function fetchDeploymentStatus() {
  return requestWithStaffToken<DeploymentStatus>("/admin-deploy/status");
}

export function triggerDeployment(ref?: string) {
  return requestWithStaffToken<TriggerDeploymentResponse>("/admin-deploy/trigger", {
    method: "POST",
    body: {
      ref
    }
  });
}

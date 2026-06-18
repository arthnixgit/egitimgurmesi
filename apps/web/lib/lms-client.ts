"use client";

import {
  clearUserTokens,
  getUserAccessToken,
  isAuthFailure,
  refreshUserToken
} from "./auth-client";

const API_BASE_URL = resolveApiBaseUrl();

type ApiErrorPayload = {
  message?: string;
};

export type StudentCourseSummary = {
  enrollmentId: string;
  status: string;
  progressPercent: number;
  grantedAt: string;
  accessEndsAt: string | null;
  product: {
    slug: string;
    name: string;
    accentColor: string | null;
  } | null;
  course: {
    slug: string;
    title: string;
    shortDescription: string | null;
    coverImageUrl: string | null;
    estimatedDurationMinutes: number | null;
    moduleCount: number;
    lessonCount: number;
    nextLessonSlug: string | null;
    nextLessonTitle: string | null;
  };
};

export type StudentCourseDetail = {
  enrollment: {
    id: string;
    status: string;
    progressPercent: number;
    grantedAt: string;
    accessStartsAt: string;
    accessEndsAt: string | null;
  };
  product: {
    id: string;
    slug: string;
    name: string;
    accentColor: string | null;
    shortDescription: string | null;
  } | null;
  course: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string | null;
    description: string | null;
    coverImageUrl: string | null;
    estimatedDurationMinutes: number | null;
    moduleCount: number;
    lessonCount: number;
    modules: Array<{
      id: string;
      title: string;
      description: string | null;
      sortOrder: number;
      lessons: Array<{
        id: string;
        slug: string;
        title: string;
        description: string | null;
        lessonType: string;
        durationSeconds: number | null;
        isPreview: boolean;
        hasVideo: boolean;
        resourceCount: number;
      }>;
    }>;
  };
  activeLesson: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    lessonType: string;
    lessonTypeLabel: string;
    durationSeconds: number | null;
    isPreview: boolean;
    moduleTitle: string;
    video: {
      provider: string;
      status: string;
      title: string | null;
      sourceUrl: string | null;
      playbackId: string | null;
      thumbnailUrl: string | null;
    } | null;
    resources: Array<{
      id: string;
      title: string;
      resourceType: string;
      storageKey: string | null;
      externalUrl: string | null;
    }>;
  };
};

export type StudentOperationalOverview = {
  branches: Array<{
    id: string;
    name: string;
    slug: string;
    city?: string | null;
    district?: string | null;
    status: string;
    isPrimary: boolean;
    organization?: { id: string; name: string; slug: string } | null;
  }>;
  instructors: Array<{
    id: string;
    name: string;
    email: string;
    branch?: { id: string; name: string } | null;
    classGroup?: { id: string; name: string } | null;
  }>;
  coaches: Array<{
    id: string;
    name: string;
    email: string;
    branch?: { id: string; name: string } | null;
    classGroup?: { id: string; name: string } | null;
  }>;
  classGroups: Array<{
    id: string;
    name: string;
    slug: string;
    gradeLevel?: string | null;
    studyTrack?: string | null;
    branch?: { id: string; name: string } | null;
    joinedAt: string;
  }>;
  upcomingSessions: Array<{
    id: string;
    title: string;
    startsAt: string;
    endsAt: string;
    meetingUrl?: string | null;
    status: string;
    participantStatus: string;
    branch?: { id: string; name: string } | null;
    classGroup?: { id: string; name: string } | null;
    course?: { id: string; title: string; slug: string } | null;
    instructor?: { id: string; name: string; email: string } | null;
    coach?: { id: string; name: string; email: string } | null;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    audience: string;
    publishAt?: string | null;
    createdAt: string;
  }>;
  packages: Array<{
    enrollmentId: string;
    status: string;
    progressPercent: number;
    product?: { id: string; name: string; slug: string; provider: string } | null;
    course: { id: string; title: string; slug: string };
    accessEndsAt?: string | null;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: string;
    currency: string;
    createdAt: string;
    payment?: Record<string, unknown> | null;
    externalOrders: Array<Record<string, unknown>>;
  }>;
  placeholders: {
    aiTutor: string;
    quiz: string;
    progress: string;
  };
};

async function parseError(response: Response): Promise<never> {
  let payload: ApiErrorPayload | null = null;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  throw new Error(payload?.message || "İstek işlenemedi.");
}

async function fetchWithToken(path: string, accessToken: string) {
  return fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

async function requestUserApi<T>(path: string) {
  const accessToken = getUserAccessToken();

  if (!accessToken) {
    throw new Error("Önce öğrenci hesabına giriş yapmalısın.");
  }

  const firstResponse = await fetchWithToken(path, accessToken);

  if (firstResponse.ok) {
    return (await firstResponse.json()) as T;
  }

  if (firstResponse.status !== 401) {
    await parseError(firstResponse);
  }

  let refreshedAccessToken: string;

  try {
    const refreshed = await refreshUserToken();
    refreshedAccessToken = refreshed.accessToken;
  } catch (error) {
    if (isAuthFailure(error)) {
      clearUserTokens();
    }
    throw error;
  }

  const retryResponse = await fetchWithToken(path, refreshedAccessToken);

  if (retryResponse.status === 401) {
    clearUserTokens();
  }

  if (!retryResponse.ok) {
    await parseError(retryResponse);
  }

  return (await retryResponse.json()) as T;
}

export function fetchMyCourses() {
  return requestUserApi<StudentCourseSummary[]>("/lms/my-courses");
}

export function fetchMyOperationalOverview() {
  return requestUserApi<StudentOperationalOverview>("/lms/my-operational-overview");
}

export function fetchMyCourse(courseSlug: string, lessonSlug?: string) {
  const query = lessonSlug ? `?lesson=${encodeURIComponent(lessonSlug)}` : "";
  return requestUserApi<StudentCourseDetail>(
    `/lms/my-courses/${encodeURIComponent(courseSlug)}${query}`
  );
}
import { resolveApiBaseUrl } from "./api-base-url";

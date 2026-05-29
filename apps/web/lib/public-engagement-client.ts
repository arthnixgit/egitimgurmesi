type FreeCallRequestPayload = {
  fullName: string;
  studentName?: string;
  phone: string;
  email?: string;
  gradeLevel?: string;
  studyTrack?: string;
  city?: string;
  note?: string;
  sourcePage?: string;
};

type FreeCallResponse = {
  success: true;
  message: string;
};

const API_BASE_URL = resolveApiBaseUrl();

async function parseError(response: Response) {
  let payload: { message?: string } | null = null;

  try {
    payload = (await response.json()) as { message?: string };
  } catch {
    payload = null;
  }

  throw new Error(payload?.message || "İstek işlenemedi.");
}

export async function submitFreeCallRequest(payload: FreeCallRequestPayload) {
  const response = await fetch(`${API_BASE_URL}/public-engagement/free-call-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as FreeCallResponse;
}
import { resolveApiBaseUrl } from "./api-base-url";

import type { Application, Profile } from "./types";

export type CreateApplicationInput = {
  profileId: string;
  plafon: number;
  tenor: number;
  dp: number;
  purpose?: string;
};

export type ExtractionUpdate = {
  thp?: number;
  cicilanTerdeteksi?: number;
  inflowBulanan?: number;
};

export type SubmitDecisionInput = {
  decision: "Approved" | "Rejected";
  reasonCode: string;
  notes?: string;
};

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseErrors(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, cache: "no-store" });
  } catch {
    throw new ApiError(0, "Tidak dapat menghubungi server.");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const body = isRecord(payload) ? payload : {};
    const message =
      typeof body.error === "string"
        ? body.error
        : `Permintaan gagal (${response.status}).`;
    throw new ApiError(response.status, message, parseErrors(body.errors));
  }

  return payload as T;
}

function jsonRequest(method: "POST" | "PATCH", body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function listApplications(): Promise<Application[]> {
  const data = await request<{ applications: Application[] }>("/api/applications");
  return data.applications;
}

export async function getApplication(
  id: string,
): Promise<{ application: Application; profile: Profile }> {
  return request(`/api/applications/${encodeURIComponent(id)}`);
}

export async function createApplication(
  input: CreateApplicationInput,
): Promise<string> {
  const data = await request<{ id: string }>(
    "/api/applications",
    jsonRequest("POST", input),
  );
  return data.id;
}

export async function extractApplication(id: string): Promise<Application> {
  const data = await request<{ application: Application }>(
    `/api/applications/${encodeURIComponent(id)}/extract`,
    { method: "POST" },
  );
  return data.application;
}

export async function updateExtraction(
  id: string,
  update: ExtractionUpdate,
): Promise<Application> {
  const data = await request<{ application: Application }>(
    `/api/applications/${encodeURIComponent(id)}/extraction`,
    jsonRequest("PATCH", update),
  );
  return data.application;
}

export async function submitDecision(
  id: string,
  input: SubmitDecisionInput,
): Promise<Application> {
  const data = await request<{ application: Application }>(
    `/api/applications/${encodeURIComponent(id)}/decision`,
    jsonRequest("POST", input),
  );
  return data.application;
}

export async function listProfiles(): Promise<Profile[]> {
  const data = await request<{ profiles: Profile[] }>("/api/profiles");
  return data.profiles;
}

export async function resetDemo(): Promise<void> {
  await request<{ ok: true }>("/api/reset", { method: "POST" });
}

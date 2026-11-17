import type { ValidationErrors } from "../validation";

export function jsonError(
  status: number,
  error: string,
  errors?: ValidationErrors,
): Response {
  return Response.json(errors ? { error, errors } : { error }, { status });
}

export async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return null;
    }
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

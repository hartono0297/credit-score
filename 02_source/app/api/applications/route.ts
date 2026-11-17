import { demoProfiles } from "@/lib/seed";
import { jsonError, readJsonBody } from "@/lib/server/http";
import { readState, updateState } from "@/lib/server/store";
import type { Application } from "@/lib/types";
import { validateNewApplication } from "@/lib/validation";

const MAX_PURPOSE_LENGTH = 120;

export async function GET() {
  try {
    const state = await readState();
    return Response.json({ applications: state.applications });
  } catch {
    return jsonError(500, "Gagal membaca data aplikasi.");
  }
}

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body) return jsonError(400, "Body JSON tidak valid.");

  const profileId = typeof body.profileId === "string" ? body.profileId : "";
  const plafon = typeof body.plafon === "number" ? body.plafon : Number.NaN;
  const tenor = typeof body.tenor === "number" ? body.tenor : Number.NaN;
  const dp = typeof body.dp === "number" ? body.dp : Number.NaN;

  const errors: Record<string, string> = {};
  let purpose: string | undefined;

  if (body.purpose !== undefined) {
    if (typeof body.purpose !== "string") {
      errors.purpose = "Tujuan harus berupa teks.";
    } else {
      const trimmed = body.purpose.trim();
      if (trimmed.length > MAX_PURPOSE_LENGTH) {
        errors.purpose = `Tujuan maksimal ${MAX_PURPOSE_LENGTH} karakter.`;
      } else if (trimmed.length > 0) {
        purpose = trimmed;
      }
    }
  }

  const validation = validateNewApplication(
    { profileId, plafon, tenor, dp },
    demoProfiles.map((profile) => profile.id),
  );
  const mergedErrors = { ...validation.errors, ...errors };
  if (Object.keys(mergedErrors).length > 0) {
    return jsonError(400, "Data aplikasi tidak valid.", mergedErrors);
  }

  const profile = demoProfiles.find((item) => item.id === profileId)!;

  try {
    const id = await updateState((state) => {
      const applicationId = `APP-${String(state.nextId).padStart(3, "0")}`;
      state.nextId += 1;

      const application: Application = {
        id: applicationId,
        profileId: profile.id,
        customerName: profile.name,
        product: "BNPL",
        plafon,
        tenor,
        dp,
        purpose,
        status: "Draft",
        documents: [],
        log: [],
      };
      state.applications.push(application);

      return applicationId;
    });

    return Response.json({ id }, { status: 201 });
  } catch {
    return jsonError(500, "Gagal menyimpan aplikasi.");
  }
}

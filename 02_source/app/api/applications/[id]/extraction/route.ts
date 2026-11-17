import { buildScoreInput } from "@/lib/extraction";
import { demoProfiles } from "@/lib/seed";
import { scoreApplication } from "@/lib/scoring";
import { jsonError, readJsonBody } from "@/lib/server/http";
import { updateState } from "@/lib/server/store";
import { isApplicationId } from "@/lib/validation";

const EXTRACTION_FIELDS = ["thp", "cicilanTerdeteksi", "inflowBulanan"] as const;
const MAX_MONTHLY_AMOUNT = 1_000_000_000;

type ExtractionField = (typeof EXTRACTION_FIELDS)[number];
type RouteContext = { params: Promise<{ id: string }> };

function isExtractionField(key: string): key is ExtractionField {
  return (EXTRACTION_FIELDS as readonly string[]).includes(key);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isApplicationId(id)) return jsonError(404, "Aplikasi tidak ditemukan.");

  const body = await readJsonBody(request);
  if (!body) return jsonError(400, "Body JSON tidak valid.");

  const errors: Record<string, string> = {};
  const updates: Partial<Record<ExtractionField, number>> = {};
  const keys = Object.keys(body);

  if (keys.length === 0) errors.fields = "Minimal satu field harus diubah.";

  for (const key of keys) {
    if (!isExtractionField(key)) {
      errors[key] = "Field ini tidak dapat diubah.";
      continue;
    }

    const value = body[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors[key] = "Nilai harus berupa angka.";
      continue;
    }
    if (key === "thp" && value <= 0) {
      errors.thp = "THP harus lebih dari 0.";
      continue;
    }
    if (key !== "thp" && value < 0) {
      errors[key] = "Nilai tidak boleh negatif.";
      continue;
    }
    if (value > MAX_MONTHLY_AMOUNT) {
      errors[key] = "Nilai melebihi batas wajar.";
      continue;
    }

    updates[key] = value;
  }

  if (Object.keys(errors).length > 0) {
    return jsonError(400, "Koreksi ekstraksi tidak valid.", errors);
  }

  try {
    const result = await updateState((state) => {
      const application = state.applications.find((item) => item.id === id);
      if (!application) return { kind: "not_found" as const };
      if (!application.extraction) return { kind: "no_extraction" as const };

      const profile = demoProfiles.find((item) => item.id === application.profileId);
      if (!profile) return { kind: "profile_missing" as const };

      const { extraction } = application;
      if (updates.thp !== undefined) {
        extraction.slipGaji.thp = {
          ...extraction.slipGaji.thp,
          value: updates.thp,
          edited: true,
        };
      }
      if (updates.cicilanTerdeteksi !== undefined) {
        extraction.mutasi.cicilanTerdeteksi = {
          ...extraction.mutasi.cicilanTerdeteksi,
          value: updates.cicilanTerdeteksi,
          edited: true,
        };
      }
      if (updates.inflowBulanan !== undefined) {
        extraction.mutasi.inflowBulanan = {
          ...extraction.mutasi.inflowBulanan,
          value: updates.inflowBulanan,
          edited: true,
        };
      }

      const score = scoreApplication(
        buildScoreInput(
          profile,
          { plafon: application.plafon, tenor: application.tenor },
          extraction,
        ),
      );
      application.score = score;
      application.status = score.guardrails.length > 0 ? "Manual Review" : "Scored";

      return { kind: "ok" as const, application };
    });

    if (result.kind === "not_found") return jsonError(404, "Aplikasi tidak ditemukan.");
    if (result.kind === "no_extraction") {
      return jsonError(409, "Ekstraksi belum tersedia untuk aplikasi ini.");
    }
    if (result.kind === "profile_missing") {
      return jsonError(500, "Profil demo tidak ditemukan.");
    }

    return Response.json({ application: result.application });
  } catch {
    return jsonError(500, "Gagal menyimpan koreksi ekstraksi.");
  }
}

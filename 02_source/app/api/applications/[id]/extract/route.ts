import { buildScoreInput, extractFromProfile } from "@/lib/extraction";
import { scoreApplication } from "@/lib/scoring";
import { demoProfiles } from "@/lib/seed";
import { jsonError } from "@/lib/server/http";
import { readState, updateState } from "@/lib/server/store";
import { isApplicationId } from "@/lib/validation";

const EXTRACTION_DELAY_MS = 1500;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isApplicationId(id)) return jsonError(404, "Aplikasi tidak ditemukan.");

  try {
    const state = await readState();
    const application = state.applications.find((item) => item.id === id);
    if (!application) return jsonError(404, "Aplikasi tidak ditemukan.");
    if (application.status !== "Draft") {
      return jsonError(409, "Ekstraksi hanya untuk aplikasi berstatus Draft.");
    }
  } catch {
    return jsonError(500, "Gagal membaca data aplikasi.");
  }

  await new Promise((resolve) => setTimeout(resolve, EXTRACTION_DELAY_MS));

  try {
    const result = await updateState((state) => {
      const application = state.applications.find((item) => item.id === id);
      if (!application) return { kind: "not_found" as const };
      if (application.status !== "Draft") return { kind: "conflict" as const };

      const profile = demoProfiles.find((item) => item.id === application.profileId);
      if (!profile) return { kind: "profile_missing" as const };

      const extraction = extractFromProfile(profile);
      const score = scoreApplication(
        buildScoreInput(
          profile,
          { plafon: application.plafon, tenor: application.tenor },
          extraction,
        ),
      );

      application.extraction = extraction;
      application.score = score;
      application.status = score.guardrails.length > 0 ? "Manual Review" : "Scored";

      return { kind: "ok" as const, application };
    });

    if (result.kind === "not_found") return jsonError(404, "Aplikasi tidak ditemukan.");
    if (result.kind === "conflict") {
      return jsonError(409, "Ekstraksi hanya untuk aplikasi berstatus Draft.");
    }
    if (result.kind === "profile_missing") {
      return jsonError(500, "Profil demo tidak ditemukan.");
    }

    return Response.json({ application: result.application });
  } catch {
    return jsonError(500, "Gagal mengekstrak dokumen.");
  }
}

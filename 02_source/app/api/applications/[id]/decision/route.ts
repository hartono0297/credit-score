import { jsonError, readJsonBody } from "@/lib/server/http";
import { updateState } from "@/lib/server/store";
import type { ReasonCode } from "@/lib/types";
import { isApplicationId, validateDecision } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isApplicationId(id)) return jsonError(404, "Aplikasi tidak ditemukan.");

  const body = await readJsonBody(request);
  if (!body) return jsonError(400, "Body JSON tidak valid.");

  const rawDecision = body.decision;
  const decision =
    rawDecision === "Approved" || rawDecision === "Rejected" ? rawDecision : "";
  const reasonCode = typeof body.reasonCode === "string" ? body.reasonCode : undefined;

  if (body.notes !== undefined && typeof body.notes !== "string") {
    return jsonError(400, "Keputusan tidak valid.", {
      notes: "Catatan harus berupa teks.",
    });
  }
  const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

  try {
    const result = await updateState((state) => {
      const application = state.applications.find((item) => item.id === id);
      if (!application) return { kind: "not_found" as const };

      if (application.status !== "Scored" && application.status !== "Manual Review") {
        return { kind: "conflict" as const };
      }

      const activeGuardrails =
        application.score?.guardrails.map((guardrail) => guardrail.id) ?? [];
      const validation = validateDecision(
        { decision: decision as "Approved" | "Rejected", reasonCode, notes },
        activeGuardrails,
      );
      if (!validation.valid) {
        return { kind: "invalid" as const, errors: validation.errors };
      }

      application.log.push({
        timestamp: new Date().toISOString(),
        applicationId: application.id,
        decision: decision as "Approved" | "Rejected",
        reasonCode: reasonCode as ReasonCode,
        notes: notes ? notes : undefined,
        activeGuardrails,
      });
      application.status = decision as "Approved" | "Rejected";

      return { kind: "ok" as const, application };
    });

    if (result.kind === "not_found") return jsonError(404, "Aplikasi tidak ditemukan.");
    if (result.kind === "conflict") {
      return jsonError(
        409,
        "Keputusan hanya dapat disimpan untuk aplikasi berstatus Scored atau Manual Review.",
      );
    }
    if (result.kind === "invalid") {
      return jsonError(400, "Keputusan tidak valid.", result.errors);
    }

    return Response.json({ application: result.application });
  } catch {
    return jsonError(500, "Gagal menyimpan keputusan.");
  }
}

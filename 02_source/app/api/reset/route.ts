import { jsonError } from "@/lib/server/http";
import { resetState } from "@/lib/server/store";

export async function POST() {
  try {
    await resetState();
    return Response.json({ ok: true });
  } catch {
    return jsonError(500, "Gagal mereset data demo.");
  }
}

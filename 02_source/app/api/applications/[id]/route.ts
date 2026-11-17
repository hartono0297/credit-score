import { demoProfiles } from "@/lib/seed";
import { jsonError } from "@/lib/server/http";
import { readState } from "@/lib/server/store";
import { isApplicationId } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isApplicationId(id)) return jsonError(404, "Aplikasi tidak ditemukan.");

  try {
    const state = await readState();
    const application = state.applications.find((item) => item.id === id);
    if (!application) return jsonError(404, "Aplikasi tidak ditemukan.");

    const profile = demoProfiles.find((item) => item.id === application.profileId);
    if (!profile) return jsonError(500, "Profil demo tidak ditemukan.");

    return Response.json({ application, profile });
  } catch {
    return jsonError(500, "Gagal membaca data aplikasi.");
  }
}

import { demoProfiles } from "@/lib/seed";

export async function GET() {
  return Response.json({ profiles: demoProfiles });
}

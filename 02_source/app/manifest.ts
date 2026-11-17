import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Credit Scoring Assistant",
    short_name: "Credit Scoring",
    description:
      "Demo review kredit BNPL untuk credit analyst: skor, faktor risiko, guardrail, dan keputusan.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f6f4",
    theme_color: "#0e5b58",
    lang: "id",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

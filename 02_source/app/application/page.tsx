import { Suspense } from "react";
import { ApplicationDetail } from "@/components/application-detail";

export default function ApplicationPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-sm text-muted">
          Memuat aplikasi...
        </p>
      }
    >
      <ApplicationDetail />
    </Suspense>
  );
}

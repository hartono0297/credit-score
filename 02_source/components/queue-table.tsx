import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import type { Application } from "@/lib/types";
import { ScoreBadge } from "./score-badge";
import { StatusBadge } from "./status-badge";

function queueHref(id: string): string {
  return `/application?id=${encodeURIComponent(id)}`;
}

export function QueueTable({ applications }: { applications: Application[] }) {
  return (
    <>
      <table className="hidden w-full border-collapse text-left text-sm md:table">
        <caption className="sr-only">Queue aplikasi kredit</caption>
        <thead>
          <tr className="border-b border-line-strong">
            <th scope="col" className="px-3 py-2.5 font-semibold text-ink">
              Nama
            </th>
            <th scope="col" className="px-3 py-2.5 font-semibold text-ink">
              Produk
            </th>
            <th scope="col" className="px-3 py-2.5 font-semibold text-ink">
              Skor
            </th>
            <th scope="col" className="px-3 py-2.5 font-semibold text-ink">
              Status
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold text-ink">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => {
            const manualReview = application.status === "Manual Review";

            return (
              <tr
                key={application.id}
                className={`border-b border-line ${manualReview ? "bg-warn-bg" : "hover:bg-surface-muted"}`}
              >
                <th scope="row" className="px-3 py-3 font-medium text-ink">
                  <Link
                    href={queueHref(application.id)}
                    className="block min-h-11 content-center hover:text-accent"
                  >
                    {application.customerName}
                    <span className="block text-xs font-normal text-muted">
                      {application.id}, {application.profileId}
                    </span>
                  </Link>
                </th>
                <td className="px-3 py-3 text-ink">
                  <span className="block font-medium">{application.product}</span>
                  <span className="block text-xs text-muted">
                    {formatRupiah(application.plafon)}, {application.tenor} bulan
                  </span>
                </td>
                <td className="px-3 py-3">
                  {application.score ? (
                    <ScoreBadge
                      score={application.score.score}
                      grade={application.score.grade}
                    />
                  ) : (
                    <span className="text-xs text-muted">Belum diskor</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={application.status} />
                </td>
                <td className="px-3 py-3 text-right">
                  <Link
                    href={queueHref(application.id)}
                    className="inline-flex min-h-11 items-center rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-accent hover:bg-accent-soft"
                  >
                    Buka aplikasi
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="space-y-3 md:hidden">
        {applications.map((application) => {
          const manualReview = application.status === "Manual Review";

          return (
            <li
              key={application.id}
              className={`rounded-card border p-4 ${
                manualReview ? "border-warn-ink/40 bg-warn-bg" : "border-line bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink">{application.customerName}</p>
                  <p className="text-xs text-muted">
                    {application.id}, {application.profileId}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink">
                  <span className="font-medium">{application.product}</span>
                  <span className="block text-xs text-muted">
                    {formatRupiah(application.plafon)}, {application.tenor} bulan
                  </span>
                </p>
                {application.score ? (
                  <ScoreBadge score={application.score.score} grade={application.score.grade} />
                ) : (
                  <span className="text-xs text-muted">Belum diskor</span>
                )}
              </div>
              <Link
                href={queueHref(application.id)}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-accent hover:bg-accent-soft"
              >
                Buka aplikasi
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

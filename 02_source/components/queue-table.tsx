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
          <tr className="border-b border-line">
            <th scope="col" className="px-3 py-2.5 text-xs font-medium text-muted">
              Nasabah
            </th>
            <th scope="col" className="px-3 py-2.5 text-xs font-medium text-muted">
              Pengajuan
            </th>
            <th scope="col" className="px-3 py-2.5 text-xs font-medium text-muted">
              Skor
            </th>
            <th scope="col" className="px-3 py-2.5 text-xs font-medium text-muted">
              Status
            </th>
            <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium text-muted">
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
                className={`border-b border-line ${manualReview ? "bg-warn-row" : "hover:bg-surface-muted"}`}
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
                  <StatusBadge status={application.status} variant="text" />
                </td>
                <td className="px-3 py-3 text-right">
                  <Link
                    href={queueHref(application.id)}
                    className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-accent hover:bg-surface-muted"
                  >
                    Buka aplikasi
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="rounded-card bg-surface md:hidden">
        <ul className="divide-y divide-line">
          {applications.map((application) => (
            <li key={application.id}>
              <Link
                href={queueHref(application.id)}
                className="flex min-h-16 items-start justify-between gap-3 p-4 hover:bg-surface-muted"
              >
                <span className="min-w-0 break-words">
                  <span className="block text-base font-semibold text-ink">
                    {application.customerName}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {application.id}, {application.profileId}
                  </span>
                  <span className="mt-2 block">
                    <StatusBadge status={application.status} variant="chip" />
                  </span>
                </span>
                <span className="shrink-0">
                  {application.score ? (
                    <ScoreBadge
                      score={application.score.score}
                      grade={application.score.grade}
                    />
                  ) : (
                    <span className="text-xs text-muted">Belum diskor</span>
                  )}
                </span>
                <span className="sr-only">Buka aplikasi {application.customerName}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

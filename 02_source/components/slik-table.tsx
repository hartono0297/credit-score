import { formatRupiah } from "@/lib/format";
import type { SlikFacility } from "@/lib/types";

function isWorst(facility: SlikFacility, worst: number): boolean {
  return facility.kolektibilitas === worst;
}

export function SlikTable({ facilities }: { facilities: SlikFacility[] }) {
  if (facilities.length === 0) {
    return <p className="text-sm text-muted">Data SLIK belum tersedia.</p>;
  }

  const worst = Math.max(...facilities.map((facility) => facility.kolektibilitas));
  const worstTone = worst >= 3 ? "bg-warn-bg" : "bg-surface-muted";

  return (
    <>
      <table className="hidden w-full border-collapse text-left text-sm md:table">
        <caption className="sr-only">Fasilitas kredit pada SLIK simulasi</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="py-2 pr-3 font-semibold text-ink">
              Lender
            </th>
            <th scope="col" className="py-2 pr-3 font-semibold text-ink">
              Jenis
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold text-ink">
              Plafon
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold text-ink">
              Baki debet
            </th>
            <th scope="col" className="py-2 font-semibold text-ink">
              Kolektibilitas
            </th>
          </tr>
        </thead>
        <tbody>
          {facilities.map((facility, index) => (
            <tr
              key={`${facility.lender}-${index}`}
              className={`border-b border-line ${isWorst(facility, worst) ? worstTone : ""}`}
            >
              <th scope="row" className="break-words py-2 pr-3 font-medium text-ink">
                {facility.lender}
              </th>
              <td className="py-2 pr-3 text-muted">{facility.jenis}</td>
              <td className="py-2 pr-3 text-right text-ink">{formatRupiah(facility.plafon)}</td>
              <td className="py-2 pr-3 text-right text-ink">{formatRupiah(facility.bakiDebet)}</td>
              <td className="py-2 text-ink">
                {facility.kolektibilitas}
                {isWorst(facility, worst) ? (
                  <span className="ml-2 text-xs font-semibold text-ink">Terburuk</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-line md:hidden">
        {facilities.map((facility, index) => (
          <li
            key={`${facility.lender}-${index}`}
            className={`py-3 ${isWorst(facility, worst) ? `-mx-3 rounded-control px-3 ${worstTone}` : ""}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="min-w-0 break-words text-sm font-semibold text-ink">{facility.lender}</p>
              <p className="text-xs text-muted">{facility.jenis}</p>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted">Plafon</dt>
              <dd className="text-right text-ink">{formatRupiah(facility.plafon)}</dd>
              <dt className="text-muted">Baki debet</dt>
              <dd className="text-right text-ink">{formatRupiah(facility.bakiDebet)}</dd>
              <dt className="text-muted">Kolektibilitas</dt>
              <dd className="text-right text-ink">
                {facility.kolektibilitas}
                {isWorst(facility, worst) ? (
                  <span className="ml-2 text-xs font-semibold">Terburuk</span>
                ) : null}
              </dd>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

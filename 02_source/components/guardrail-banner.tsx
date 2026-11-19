export function GuardrailBanner({
  guardrails,
}: {
  guardrails: { id: string; label: string }[];
}) {
  if (guardrails.length === 0) return null;

  return (
    <section
      aria-labelledby="guardrail-title"
      className="rounded-control bg-warn-bg p-4 text-warn-ink"
    >
      <h3 id="guardrail-title" className="text-[13px] font-semibold">
        Manual Review diperlukan
      </h3>
      <ul className="mt-2 space-y-1 text-sm">
        {guardrails.map((guardrail) => (
          <li key={guardrail.id}>
            <span className="font-semibold">{guardrail.id}</span>: {guardrail.label}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs">
        Keputusan tetap dapat dicatat. Catatan wajib diisi saat menyimpan keputusan.
      </p>
    </section>
  );
}

import Flag from "@/components/Flag";
import type { MonthEnd } from "@/lib/data";

const money = (n: number | null | undefined) =>
  n == null ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** One line of a month-close calculation: the arithmetic on the left as the
 * sheet states it, the resulting figure on the right. */
function EqRow({
  label,
  equation,
  value,
  emphasis,
}: {
  label: string;
  equation?: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-[color:var(--color-border)] py-2 last:border-b-0">
      <div className="min-w-0">
        <span className="text-sm">{label}</span>
        {equation && (
          <span className="ml-2 font-mono text-xs text-[color:var(--color-text-muted)]">{equation}</span>
        )}
      </div>
      <span
        className="font-mono text-sm"
        style={{ color: emphasis ? "var(--color-accent)" : undefined, fontWeight: emphasis ? 600 : 400 }}
      >
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="hq-card p-5">
      <h3 className="hq-eyebrow mb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function MonthEndPanel({
  data,
  only,
}: {
  data: MonthEnd;
  /** Render just one section (for per-topic pages). Omit for the full close-out. */
  only?: "fuel" | "landingFees" | "shopPurchases" | "invoices" | "hangar";
}) {
  const show = (k: NonNullable<typeof only>) => !only || only === k;

  return (
    <div className="mb-6 space-y-4">
      {!only && (
        <p className="text-xs text-[color:var(--color-text-muted)]">
          Month-end close for <strong>{data.label}</strong>, taken from{" "}
          <span className="font-mono">{data.sourceWorkbook}</span>. Each figure below is the
          workbook&apos;s own stated calculation, checked against the same number recomputed from
          the detail rows.
        </p>
      )}

      {show("fuel") && (
        <div className="grid gap-4 lg:grid-cols-2">
          {(["100LL", "jetA"] as const).map((tank) => {
            const t = data.fuel[tank];
            return (
              <Section key={tank} title={`${tank === "jetA" ? "Jet A" : tank} — leak check`}>
                {t.flags.map((f) => (
                  <Flag key={f}>{f}</Flag>
                ))}
                <EqRow label="Total gallons pumped" value={`${t.totalGallonsPumped.toLocaleString()} gal`} />
                <EqRow
                  label="Total daily over / short"
                  value={`${(t.totalOverShortGal ?? 0).toLocaleString()} gal`}
                />
                <EqRow label="Leak-check threshold" equation={t.leakCheck.equation} value={`${t.leakCheck.threshold.toLocaleString()} gal`} />
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span
                    className={`hq-dot ${t.leakCheck.exceeded ? "hq-dot--danger" : ""}`}
                    aria-hidden="true"
                  />
                  <span>
                    {t.leakCheck.exceeded
                      ? "Over/short EXCEEDS the leak-check threshold — investigate."
                      : "Within the leak-check threshold."}
                  </span>
                  <span className="ml-auto font-mono text-xs text-[color:var(--color-text-muted)]">
                    sheet says: {t.leakCheck.sheetResult ?? "—"}
                  </span>
                </div>
              </Section>
            );
          })}
        </div>
      )}

      {show("landingFees") && (
        <Section title="Landing fees — month totals">
          {data.landingFees.flags.map((f) => (
            <Flag key={f}>{f}</Flag>
          ))}
          <EqRow label="Gross collected" value={money(data.landingFees.grossTotal)} />
          <EqRow label="Less state sales tax (5%)" value={money(data.landingFees.salesTax)} />
          <EqRow label="Less AVFuel processing (3.5%)" value={money(data.landingFees.ccFees)} />
          <EqRow label="Net after costs" value={money(data.landingFees.netAfterCosts)} />
          <EqRow
            label="80% share"
            equation={data.landingFees.equation}
            value={money(data.landingFees.eightyPctShare)}
            emphasis
          />
          <EqRow label="20% share" value={money(data.landingFees.twentyPctShare)} />
          <EqRow
            label={`Sheet's "Amount Due" → ${data.landingFees.payTo ?? "—"}`}
            value={money(data.landingFees.amountDue)}
          />
        </Section>
      )}

      {show("shopPurchases") && (
        <Section title="Maintenance shop purchases">
          {data.shopPurchases.flags.map((f) => (
            <Flag key={f}>{f}</Flag>
          ))}
          <EqRow
            label="Workbook's stated total"
            equation={data.shopPurchases.equation}
            value={money(data.shopPurchases.sheetStatedTotal)}
          />
          <EqRow label="Recomputed from all rows" value={money(data.shopPurchases.computedTotal)} emphasis />
        </Section>
      )}

      {show("invoices") && data.invoices.length > 0 && (
        <Section title="Invoices issued">
          {data.invoices.map((inv, i) => (
            <EqRow
              key={i}
              label={inv.to ?? "—"}
              equation={`${inv.lineItems} line items · ${inv.gallons.toLocaleString()} gal${inv.invoiceNo ? ` · ${inv.invoiceNo}` : ""}`}
              value={money(inv.total)}
            />
          ))}
          <EqRow
            label="Total invoiced"
            value={money(data.invoices.reduce((s, i) => s + i.total, 0))}
            emphasis
          />
        </Section>
      )}

      {show("hangar") && (
        <Section title="Hangar settlement">
          {data.hangar.flags.map((f) => (
            <Flag key={f}>{f}</Flag>
          ))}
          <EqRow label="Total net rents" value={money(data.hangar.totalNetRents)} />
          <EqRow label={`Owner share (${data.hangar.ownerShareLabel})`} value={money(data.hangar.ownerShareAmount)} />
          <EqRow label="Adjustments" value={money(data.hangar.adjustments)} />
          <EqRow label="Total due to owner" equation={data.hangar.equation} value={money(data.hangar.totalDue)} emphasis />
        </Section>
      )}
    </div>
  );
}

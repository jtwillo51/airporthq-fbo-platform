import PageHeader from "@/components/PageHeader";
import Flag from "@/components/Flag";
import { getProfitability, type ProfitLine } from "@/lib/profitability";

const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Bar({ line, max }: { line: ProfitLine; max: number }) {
  const pos = line.margin >= 0;
  const width = max > 0 ? Math.min(100, (Math.abs(line.margin) / max) * 100) : 0;
  return (
    <div className="border-b border-[color:var(--color-border)] py-3 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="text-sm font-medium">{line.label}</span>
        <span
          className="font-mono text-sm"
          style={{ color: pos ? "var(--color-success)" : "var(--color-danger)" }}
        >
          {money(line.margin)}
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded bg-[color:var(--color-border)]">
        <div
          className="h-2 rounded"
          style={{ width: `${width}%`, background: pos ? "var(--color-success)" : "var(--color-danger)" }}
        />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 font-mono text-xs text-[color:var(--color-text-muted)]">
        <span>rev {money(line.revenue)}</span>
        <span>cost {money(line.cost)}</span>
        <span>{line.marginPct == null ? "—" : `${line.marginPct}% margin`}</span>
        <span>
          {line.units.toLocaleString()} {line.unitLabel}
        </span>
      </div>
      {line.caveat && (
        <p className="mt-1 text-xs" style={{ color: "var(--color-accent)" }}>
          {line.caveat}
        </p>
      )}
    </div>
  );
}

export default async function ProfitabilityPage() {
  const report = await getProfitability({ allHistory: true });
  const maxService = Math.max(...report.services.map((s) => Math.abs(s.margin)), 1);
  const maxTruck = Math.max(...report.trucks.map((t) => Math.abs(t.margin)), 1);

  return (
    <div>
      <PageHeader
        title="Profitability"
        subtitle={`Margin by service line and by fuel truck · ${report.months.length} month(s) through today`}
      />
      <div className="space-y-8 p-8">
        {report.caveats.map((c) => (
          <Flag key={c}>{c}</Flag>
        ))}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="hq-tile">
            <p className="hq-tile-label">Best service</p>
            <p className="hq-tile-value" style={{ fontSize: "1.25rem" }}>
              {report.best.services?.label ?? "—"}
            </p>
            <p className="hq-tile-sub">{report.best.services ? money(report.best.services.margin) : ""}</p>
          </div>
          <div className="hq-tile">
            <p className="hq-tile-label">Weakest service</p>
            <p className="hq-tile-value" style={{ fontSize: "1.25rem" }}>
              {report.worst.services?.label ?? "—"}
            </p>
            <p className="hq-tile-sub">{report.worst.services ? money(report.worst.services.margin) : ""}</p>
          </div>
          <div className="hq-tile hq-tile--accent">
            <p className="hq-tile-label">Best truck</p>
            <p className="hq-tile-value" style={{ fontSize: "1.25rem" }}>
              {report.best.trucks?.key ?? "—"}
            </p>
            <p className="hq-tile-sub">{report.best.trucks ? money(report.best.trucks.margin) : ""}</p>
          </div>
          <div className="hq-tile">
            <p className="hq-tile-label">Weakest truck</p>
            <p className="hq-tile-value" style={{ fontSize: "1.25rem" }}>
              {report.worst.trucks?.key ?? "—"}
            </p>
            <p className="hq-tile-sub">{report.worst.trucks ? money(report.worst.trucks.margin) : ""}</p>
          </div>
        </div>

        <section className="hq-card p-6">
          <h2 className="hq-eyebrow mb-2">By service line</h2>
          {report.services.map((s) => (
            <Bar key={s.key} line={s} max={maxService} />
          ))}
        </section>

        <section className="hq-card p-6">
          <h2 className="hq-eyebrow mb-2">By fuel truck</h2>
          {report.trucks.map((t) => (
            <Bar key={t.key} line={t} max={maxTruck} />
          ))}
        </section>
      </div>
    </div>
  );
}

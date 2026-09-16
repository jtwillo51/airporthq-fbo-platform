"use client";

import { useEffect, useRef, useState } from "react";
import Flag from "@/components/Flag";
import MonthSearchBar from "@/components/MonthSearchBar";
import MonthEndPanel from "@/components/MonthEndPanel";
import type { MonthEnd } from "@/lib/data";
import type { PopularService, ProfitRollup } from "@/lib/reports";

interface ReportsData {
  rollup: ProfitRollup;
  popular: PopularService[];
  monthsPresent: string[];
  monthEnd: MonthEnd | null;
}

export default function ReportsClient({ initial, initialMonth }: { initial: ReportsData; initialMonth: string }) {
  const [month, setMonth] = useState(initialMonth);
  const [allHistory, setAllHistory] = useState(false);
  const [data, setData] = useState<ReportsData>(initial);
  const [loading, setLoading] = useState(false);

  // The server already computed `initial` for initialMonth, so the first
  // render must NOT refetch it - only go to the network once the month or
  // the all-history toggle actually changes.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ month, allHistory: String(allHistory) });
    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then((d: ReportsData) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, allHistory]);

  const { rollup, popular, monthsPresent } = data;
  // A month-end close describes exactly one month; it is meaningless across
  // a multi-month range, so it is not rendered when all-history is on.
  const monthEnd = allHistory ? null : data.monthEnd;

  return (
    <div className="space-y-8 p-8" style={{ opacity: loading ? 0.6 : 1, transition: "opacity 120ms" }}>
      <MonthSearchBar
        showSearch={false}
        month={month}
        onMonthChange={setMonth}
        monthsPresent={monthsPresent}
        query=""
        onQueryChange={() => {}}
        allHistory={allHistory}
        onAllHistoryChange={setAllHistory}
      />

      {rollup.caveats.map((c) => (
        <Flag key={c}>{c}</Flag>
      ))}

      <section>
        <h2 className="mb-3 font-semibold">Popular Services (by revenue)</h2>
        <div className="space-y-2">
          {popular.map((p) => (
            <div key={p.label} className="flex items-center gap-3">
              <span className="w-64 text-sm">{p.label}</span>
              <div className="h-3 flex-1 rounded bg-[color:var(--color-border)]">
                <div
                  className="h-3 rounded bg-[color:var(--color-accent)]"
                  style={{ width: `${Math.min(100, (p.amount / (popular[0]?.amount || 1)) * 100)}%` }}
                />
              </div>
              <span className="w-24 text-right font-mono text-sm">${p.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="hq-card p-6">
          <h3 className="hq-eyebrow">Fuel</h3>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label="Gross gallons pumped" value={`${rollup.fuel.grossGallons.toLocaleString()} gal`} />
            <Row label="Derived revenue (matched)" value={`$${rollup.fuel.matchedRevenue.toLocaleString()}`} />
            <Row
              label="Unmatched gallons"
              value={`${rollup.fuel.unmatchedGallons.toLocaleString()} gal (${rollup.fuel.unmatchedCount} tx)`}
            />
          </dl>
        </div>
        <div className="hq-card p-6">
          <h3 className="hq-eyebrow">Landing Fees</h3>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label="Total collected" value={`$${rollup.landingFees.total.toLocaleString()}`} />
            <Row label="FBO share (80%)" value={`$${rollup.landingFees.fboShare.toLocaleString()}`} />
            <Row label="Airport authority (20%)" value={`$${rollup.landingFees.airportShare.toLocaleString()}`} />
          </dl>
          <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
            Split after 5% sales tax and 3.5% card fees.
          </p>
        </div>
        <div className="hq-card p-6">
          <h3 className="hq-eyebrow">Hangar</h3>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label="Net rent" value={`$${rollup.hangar.netRent.toLocaleString()}`} />
            <Row label="Owner share" value={`$${rollup.hangar.ownerShare.toLocaleString()}`} />
            <Row label="FBO retained" value={`$${rollup.hangar.fboRetained.toLocaleString()}`} />
          </dl>
        </div>
        <div className="hq-card p-6">
          <h3 className="hq-eyebrow">Expenses</h3>
          <dl className="mt-3 space-y-1.5 text-sm">
            <Row label="FBO card" value={`$${rollup.expenses.fboCard.toLocaleString()}`} />
            <Row label="Shop purchases" value={`$${rollup.expenses.shopPurchases.toLocaleString()}`} />
          </dl>
        </div>
      </section>

      <section className="hq-tile hq-tile--accent max-w-md">
        <p className="hq-tile-label">Net profit estimate</p>
        <p className="hq-tile-value" style={{ fontSize: "2.25rem" }}>
          ${rollup.netEstimate.toLocaleString()}
        </p>
        <p className="hq-tile-sub mt-2">
          = fuel revenue + landing fee FBO share + hangar retained rent &minus; FBO card &amp;
          shop purchase expenses.
        </p>
      </section>

      {monthEnd ? (
        <section>
          <h2 className="mb-3 font-semibold">Month-end close &mdash; {monthEnd.label}</h2>
          <MonthEndPanel data={monthEnd} />
        </section>
      ) : (
        <section>
          <h2 className="mb-1 font-semibold">Month-end close</h2>
          <p className="text-sm text-[color:var(--color-text-muted)]">
            No month-end close block has been loaded for this period.
          </p>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[color:var(--color-text-muted)]">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}

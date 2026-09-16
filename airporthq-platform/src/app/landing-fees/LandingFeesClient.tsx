"use client";

import MonthSearchBar from "@/components/MonthSearchBar";
import { useMonthSearch } from "@/lib/useMonthSearch";
import type { LandingFee } from "@/lib/data";
import LandingFeesTable from "./LandingFeesTable";

const SEARCH_KEYS = ["tailNumber", "note"];

export default function LandingFeesClient({ records }: { records: LandingFee[] }) {
  const filter = useMonthSearch<LandingFee>({ rows: records, dateKey: "date", searchKeys: SEARCH_KEYS });

  const totals = filter.result.reduce(
    (acc, r) => ({
      total: acc.total + (r.total ?? 0),
      fbo: acc.fbo + (r.fboShare ?? 0),
      airport: acc.airport + (r.airportShare ?? 0),
    }),
    { total: 0, fbo: 0, airport: 0 }
  );

  return (
    <>
      <MonthSearchBar
        month={filter.month}
        onMonthChange={filter.setMonth}
        monthsPresent={filter.monthsPresent}
        query={filter.query}
        onQueryChange={filter.setQuery}
        allHistory={filter.allHistory}
        onAllHistoryChange={filter.setAllHistory}
        resultCount={filter.result.length}
        searchPlaceholder="Search by tail number…"
      />
      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        <div className="hq-tile">
          <p className="hq-tile-label">Total collected</p>
          <p className="hq-tile-value">${totals.total.toFixed(2)}</p>
        </div>
        <div className="hq-tile hq-tile--accent">
          <p className="hq-tile-label">FBO share (80%)</p>
          <p className="hq-tile-value">${totals.fbo.toFixed(2)}</p>
        </div>
        <div className="hq-tile">
          <p className="hq-tile-label">Airport share (20%)</p>
          <p className="hq-tile-value">${totals.airport.toFixed(2)}</p>
        </div>
      </div>
      <LandingFeesTable records={filter.result} />
    </>
  );
}

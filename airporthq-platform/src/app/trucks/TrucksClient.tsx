"use client";

import { useMemo } from "react";
import MonthSearchBar from "@/components/MonthSearchBar";
import { filterRows, getMonthsPresent, useFilterState } from "@/lib/useMonthSearch";
import type { TruckLog } from "@/lib/data";
import TruckTable from "./TruckTable";

const SEARCH_KEYS = ["tailNumberOrNote"];

export default function TrucksClient({ log }: { log: TruckLog }) {
  const monthsPresent = useMemo(
    () =>
      Array.from(
        new Set([...getMonthsPresent(log.truck4.entries, "date"), ...getMonthsPresent(log.truck3.entries, "date")])
      ).sort(),
    [log]
  );
  const { month, setMonth, query, setQuery, allHistory, setAllHistory } = useFilterState(
    monthsPresent.at(-1)
  );

  const truck4 = useMemo(
    () => filterRows({ rows: log.truck4.entries, dateKey: "date", searchKeys: SEARCH_KEYS, month, query, allHistory }),
    [log, month, query, allHistory]
  );
  const truck3 = useMemo(
    () => filterRows({ rows: log.truck3.entries, dateKey: "date", searchKeys: SEARCH_KEYS, month, query, allHistory }),
    [log, month, query, allHistory]
  );

  return (
    <>
      <MonthSearchBar
        month={month}
        onMonthChange={setMonth}
        monthsPresent={monthsPresent}
        query={query}
        onQueryChange={setQuery}
        allHistory={allHistory}
        onAllHistoryChange={setAllHistory}
        resultCount={truck4.length + truck3.length}
        searchPlaceholder="Search by tail number…"
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 font-semibold">{log.truck4.label}</h2>
          <p className="mb-3 text-xs text-[color:var(--color-text-muted)]">
            Capacity: {log.truck4.capacityGal.toLocaleString()} gal
          </p>
          <TruckTable entries={truck4} />
        </section>
        <section>
          <h2 className="mb-1 font-semibold">{log.truck3.label}</h2>
          <p className="mb-3 text-xs text-[color:var(--color-text-muted)]">
            Capacity: {log.truck3.capacityGal.toLocaleString()} gal
          </p>
          <TruckTable entries={truck3} />
        </section>
      </div>
    </>
  );
}

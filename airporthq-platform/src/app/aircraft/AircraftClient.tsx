"use client";

import { useMemo } from "react";
import MonthSearchBar from "@/components/MonthSearchBar";
import { filterRows, getMonthsPresent, useFilterState } from "@/lib/useMonthSearch";
import LocationTable from "./LocationTable";

interface DayRow {
  date: string;
  tailNumbers: (string | null)[];
}

const SEARCH_KEYS = ["tailNumbers"];

export default function AircraftClient({
  tieDown,
  shopStorage,
}: {
  tieDown: DayRow[];
  shopStorage: DayRow[];
}) {
  const monthsPresent = useMemo(
    () => Array.from(new Set([...getMonthsPresent(tieDown, "date"), ...getMonthsPresent(shopStorage, "date")])).sort(),
    [tieDown, shopStorage]
  );
  const { month, setMonth, query, setQuery, allHistory, setAllHistory } = useFilterState(
    monthsPresent.at(-1)
  );

  const tieDownFiltered = useMemo(
    () => filterRows({ rows: tieDown, dateKey: "date", searchKeys: SEARCH_KEYS, month, query, allHistory }),
    [tieDown, month, query, allHistory]
  );
  const shopFiltered = useMemo(
    () => filterRows({ rows: shopStorage, dateKey: "date", searchKeys: SEARCH_KEYS, month, query, allHistory }),
    [shopStorage, month, query, allHistory]
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
        resultCount={tieDownFiltered.length + shopFiltered.length}
        searchPlaceholder="Search by tail number…"
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 font-semibold">Tie-Down (Ramp)</h2>
          <LocationTable days={tieDownFiltered} />
        </section>
        <section>
          <h2 className="mb-1 font-semibold">Shop Storage</h2>
          <LocationTable days={shopFiltered} />
        </section>
      </div>
    </>
  );
}

"use client";

import { useMemo } from "react";
import MonthSearchBar from "@/components/MonthSearchBar";
import { filterRows, getMonthsPresent, useFilterState } from "@/lib/useMonthSearch";
import type { FuelTankLog } from "@/lib/data";
import TankTable from "./TankTable";

const SEARCH_KEYS = ["initials"];

export default function FuelLogsClient({ tanks }: { tanks: FuelTankLog }) {
  const monthsPresent = useMemo(
    () =>
      Array.from(
        new Set([...getMonthsPresent(tanks["100LL"], "date"), ...getMonthsPresent(tanks.jetA, "date")])
      ).sort(),
    [tanks]
  );
  const { month, setMonth, query, setQuery, allHistory, setAllHistory } = useFilterState(
    monthsPresent.at(-1)
  );

  const rows100LL = useMemo(
    () => filterRows({ rows: tanks["100LL"], dateKey: "date", searchKeys: SEARCH_KEYS, month, query, allHistory }),
    [tanks, month, query, allHistory]
  );
  const rowsJetA = useMemo(
    () => filterRows({ rows: tanks.jetA, dateKey: "date", searchKeys: SEARCH_KEYS, month, query, allHistory }),
    [tanks, month, query, allHistory]
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
        resultCount={rows100LL.length + rowsJetA.length}
        searchPlaceholder="Search by initials…"
      />
      <section>
        <h2 className="mb-3 font-semibold">100LL</h2>
        <TankTable rows={rows100LL} />
      </section>
      <section>
        <h2 className="mb-3 font-semibold">Jet A</h2>
        <TankTable rows={rowsJetA} />
      </section>
    </>
  );
}

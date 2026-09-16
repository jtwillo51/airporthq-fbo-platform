"use client";

import MonthSearchBar from "@/components/MonthSearchBar";
import { useMonthSearch } from "@/lib/useMonthSearch";
import type { CashEntry } from "@/lib/data";
import CashBoxTable from "./CashBoxTable";

const SEARCH_KEYS = ["transactionDetails", "initials"];

export default function CashBoxClient({ entries }: { entries: CashEntry[] }) {
  const filter = useMonthSearch<CashEntry>({ rows: entries, dateKey: "date", searchKeys: SEARCH_KEYS });

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
        searchPlaceholder="Search transaction details…"
      />
      <CashBoxTable entries={filter.result} />
    </>
  );
}

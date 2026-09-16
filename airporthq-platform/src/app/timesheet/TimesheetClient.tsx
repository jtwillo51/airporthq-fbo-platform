"use client";

import MonthSearchBar from "@/components/MonthSearchBar";
import { useMonthSearch } from "@/lib/useMonthSearch";
import type { TimesheetDay } from "@/lib/data";
import TimesheetTable from "./TimesheetTable";

const SEARCH_KEYS = ["day", "onCall"];

export default function TimesheetClient({ employees, days }: { employees: string[]; days: TimesheetDay[] }) {
  const filter = useMonthSearch<TimesheetDay>({ rows: days, dateKey: "date", searchKeys: SEARCH_KEYS });

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
        searchPlaceholder="Search by day or on-call name…"
      />
      <TimesheetTable employees={employees} days={filter.result} />
    </>
  );
}

"use client";

import MonthSearchBar from "@/components/MonthSearchBar";
import { useMonthSearch } from "@/lib/useMonthSearch";
import type { Customer } from "@/lib/data";
import CustomersTable from "./CustomersTable";

const SEARCH_KEYS = ["tailNumber", "owner", "attention", "aircraftType"];

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const filter = useMonthSearch<Customer>({ rows: customers, searchKeys: SEARCH_KEYS });

  return (
    <>
      <MonthSearchBar
        dateScoped={false}
        month={filter.month}
        onMonthChange={filter.setMonth}
        monthsPresent={filter.monthsPresent}
        query={filter.query}
        onQueryChange={filter.setQuery}
        allHistory={filter.allHistory}
        onAllHistoryChange={filter.setAllHistory}
        resultCount={filter.result.length}
        searchPlaceholder="Search tail number, owner, aircraft type…"
      />
      <CustomersTable customers={filter.result} />
    </>
  );
}

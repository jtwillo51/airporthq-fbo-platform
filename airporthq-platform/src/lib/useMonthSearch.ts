"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";

export const EARLIEST_MONTH = "2015-01";

function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export const LATEST_MONTH = currentMonthStr();

function monthOf(dateStr: string | null | undefined): string | null {
  return dateStr ? dateStr.slice(0, 7) : null;
}

export function getMonthsPresent<T>(rows: T[], dateKey: keyof T): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const m = monthOf(r[dateKey] as unknown as string | null);
    if (m) set.add(m);
  }
  return Array.from(set).sort();
}

/** Shared month/search/all-history controls, with no dataset attached -
 * use this when one filter bar governs more than one table on a page. */
export function useFilterState(defaultMonth: string = LATEST_MONTH) {
  const [month, setMonth] = useState(defaultMonth);
  const [query, setQuery] = useState("");
  const [allHistory, setAllHistory] = useState(false);
  return { month, setMonth, query, setQuery, allHistory, setAllHistory };
}

/** Applies month scoping + fuzzy search to one dataset, given shared or
 * per-table controls. Pure with respect to render (memoized internally by
 * the caller's own useMemo if desired - kept simple/direct here since
 * datasets in this app are small). */
export function filterRows<T>({
  rows,
  dateKey,
  searchKeys,
  month,
  query,
  allHistory,
}: {
  rows: T[];
  dateKey?: keyof T;
  searchKeys: string[];
  month: string;
  query: string;
  allHistory: boolean;
}): T[] {
  const monthFiltered =
    !dateKey || allHistory
      ? rows
      : rows.filter((r) => monthOf(r[dateKey] as unknown as string | null) === month);

  if (!query.trim()) return monthFiltered;

  const fuse = new Fuse(monthFiltered, { keys: searchKeys, threshold: 0.35, ignoreLocation: true });
  return fuse.search(query).map((r) => r.item);
}

/** Convenience hook for a page with exactly one dataset/table. */
export function useMonthSearch<T>({
  rows,
  dateKey,
  searchKeys,
}: {
  rows: T[];
  dateKey?: keyof T;
  searchKeys: string[];
}) {
  const monthsPresent = useMemo(
    () => (dateKey ? getMonthsPresent(rows, dateKey) : []),
    [rows, dateKey]
  );
  const shared = useFilterState(monthsPresent.at(-1) ?? LATEST_MONTH);

  const result = useMemo(
    () =>
      filterRows({
        rows,
        dateKey,
        searchKeys,
        month: shared.month,
        query: shared.query,
        allHistory: shared.allHistory,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, dateKey, searchKeys.join(","), shared.month, shared.query, shared.allHistory]
  );

  return { ...shared, monthsPresent, result };
}

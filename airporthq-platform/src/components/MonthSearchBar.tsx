"use client";

import { EARLIEST_MONTH, LATEST_MONTH } from "@/lib/useMonthSearch";

function labelForMonth(m: string): string {
  if (!m) return "";
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function MonthSearchBar({
  dateScoped = true,
  showSearch = true,
  month,
  onMonthChange,
  monthsPresent,
  query,
  onQueryChange,
  allHistory,
  onAllHistoryChange,
  resultCount,
  searchPlaceholder = "Search…",
}: {
  dateScoped?: boolean;
  showSearch?: boolean;
  month: string;
  onMonthChange: (m: string) => void;
  monthsPresent: string[];
  query: string;
  onQueryChange: (q: string) => void;
  allHistory: boolean;
  onAllHistoryChange: (v: boolean) => void;
  resultCount?: number;
  searchPlaceholder?: string;
}) {
  const hasDataForMonth = monthsPresent.includes(month);

  return (
    <div className="hq-card mb-5 p-4">
      <div className="flex flex-wrap items-end gap-4">
        {dateScoped && (
          <label className="block text-xs text-[color:var(--color-text-muted)]">
            Month
            <input
              type="month"
              min={EARLIEST_MONTH}
              max={LATEST_MONTH}
              value={month}
              disabled={allHistory}
              onChange={(e) => onMonthChange(e.target.value)}
              className="input mt-1 disabled:opacity-50"
              style={{ width: "auto" }}
            />
          </label>
        )}

        {showSearch && (
          <label className="block min-w-[220px] flex-1 text-xs text-[color:var(--color-text-muted)]">
            {dateScoped ? `Search ${allHistory ? "all history" : labelForMonth(month)}` : "Search"}
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="input mt-1"
            />
          </label>
        )}

        {dateScoped && (
          <label className="flex items-center gap-2 pb-2 text-xs text-[color:var(--color-text-muted)]">
            <input
              type="checkbox"
              checked={allHistory}
              onChange={(e) => onAllHistoryChange(e.target.checked)}
            />
            {showSearch ? "Search" : "Include"} all history ({EARLIEST_MONTH.slice(0, 4)}–present)
          </label>
        )}

        {resultCount != null && (
          <span className="pb-2 text-xs text-[color:var(--color-text-muted)]">
            {resultCount.toLocaleString()} result{resultCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {dateScoped && !allHistory && !hasDataForMonth && (
        <p className="mt-3 text-xs" style={{ color: "var(--color-accent)" }}>
          No data loaded for {labelForMonth(month)}.{" "}
          {monthsPresent.length > 0
            ? `Currently loaded: ${monthsPresent.map(labelForMonth).join(", ")}.`
            : "No months loaded yet."}
        </p>
      )}
      {dateScoped && allHistory && monthsPresent.length <= 1 && (
        <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">
          Searching all loaded history &mdash; currently just {labelForMonth(monthsPresent[0] ?? month)}.
          Earlier months will be included here automatically as they&apos;re added.
        </p>
      )}
    </div>
  );
}

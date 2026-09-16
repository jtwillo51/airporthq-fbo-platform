"use client";

import { useMemo, useState } from "react";

export interface Column<T> {
  key: string;
  label: string;
  sortValue?: (row: T) => string | number | null;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right";
  numeric?: boolean;
}

export default function SortableTable<T>({
  columns,
  rows,
  getRowKey,
  defaultSortKey,
  defaultDirection = "asc",
  stickyHeader = false,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  defaultSortKey?: string;
  defaultDirection?: "asc" | "desc";
  stickyHeader?: boolean;
}) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [direction, setDirection] = useState<"asc" | "desc">(defaultDirection);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const withIndex = rows.map((r, i) => ({ r, i }));
    withIndex.sort((a, b) => {
      const av = col.sortValue!(a.r);
      const bv = col.sortValue!(b.r);
      if (av == null && bv == null) return a.i - b.i;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return (cmp === 0 ? a.i - b.i : cmp) * (direction === "asc" ? 1 : -1);
    });
    return withIndex.map((x) => x.r);
  }, [rows, sortKey, direction, columns]);

  function handleSort(col: Column<T>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setDirection("asc");
    }
  }

  return (
    <table className="hq-table w-full text-sm">
      <thead>
        <tr
          className={stickyHeader ? "sticky top-0 z-10" : undefined}
          style={stickyHeader ? { background: "var(--color-bg-panel)" } : undefined}
        >
          {columns.map((c) => {
            const active = sortKey === c.key;
            return (
              <th
                key={c.key}
                scope="col"
                aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
                className={c.align === "right" || c.numeric ? "text-right" : "text-left"}
              >
                {c.sortValue ? (
                  <button
                    type="button"
                    onClick={() => handleSort(c)}
                    className={`hq-sort-btn ${active ? "hq-sort-btn--active" : ""}`}
                  >
                    {c.label}
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 9 9"
                      aria-hidden="true"
                      className="hq-sort-caret"
                      style={{
                        opacity: active ? 1 : 0.35,
                        transform: active && direction === "desc" ? "rotate(180deg)" : undefined,
                      }}
                    >
                      <path d="M4.5 1.5 L8 6.5 L1 6.5 Z" fill="currentColor" />
                    </svg>
                  </button>
                ) : (
                  <span className="hq-sort-btn hq-sort-btn--static">{c.label}</span>
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, i) => (
          <tr key={getRowKey(row, i)}>
            {columns.map((c) => (
              <td key={c.key} className={c.align === "right" || c.numeric ? "text-right" : undefined}>
                {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

"use client";

import SortableTable, { type Column } from "@/components/SortableTable";

interface DayRow {
  date: string;
  tailNumbers: (string | null)[];
}

const COLUMNS: Column<DayRow>[] = [
  { key: "date", label: "Date", sortValue: (r) => r.date },
  {
    key: "tails",
    label: "Tail numbers",
    sortValue: (r) => r.tailNumbers.filter(Boolean).length,
    render: (r) => (
      <span className="font-sans">
        {r.tailNumbers.filter(Boolean).join(", ") || (
          <span className="text-[color:var(--color-text-muted)]">none</span>
        )}
      </span>
    ),
  },
];

export default function LocationTable({ days }: { days: DayRow[] }) {
  return (
    <SortableTable columns={COLUMNS} rows={days} getRowKey={(r) => r.date} defaultSortKey="date" defaultDirection="asc" />
  );
}

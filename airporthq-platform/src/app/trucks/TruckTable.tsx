"use client";

import SortableTable, { type Column } from "@/components/SortableTable";
import type { TruckEntry } from "@/lib/data";

const COLUMNS: Column<TruckEntry>[] = [
  { key: "date", label: "Date", sortValue: (r) => r.date },
  { key: "tail", label: "Tail # / Note", sortValue: (r) => r.tailNumberOrNote, render: (r) => <span className="whitespace-pre-wrap font-sans">{r.tailNumberOrNote}</span> },
  { key: "gallons", label: "Gallons", numeric: true, sortValue: (r) => r.gallons, render: (r) => r.gallons },
  { key: "total", label: "Running total", numeric: true, sortValue: (r) => r.runningTotalGal, render: (r) => r.runningTotalGal },
];

export default function TruckTable({ entries }: { entries: TruckEntry[] }) {
  return (
    <div className="max-h-[600px] overflow-y-auto">
      <SortableTable
        columns={COLUMNS}
        rows={entries}
        getRowKey={(r, i) => `${r.date}-${i}`}
        defaultSortKey="date"
        defaultDirection="asc"
        stickyHeader
      />
    </div>
  );
}

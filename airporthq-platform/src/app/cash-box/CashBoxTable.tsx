"use client";

import SortableTable, { type Column } from "@/components/SortableTable";
import type { CashEntry } from "@/lib/data";

const COLUMNS: Column<CashEntry>[] = [
  { key: "date", label: "Date", sortValue: (r) => r.date },
  { key: "details", label: "Details", sortValue: (r) => r.transactionDetails, render: (r) => <span className="font-sans">{r.transactionDetails}</span> },
  { key: "amount", label: "Amount", numeric: true, sortValue: (r) => r.amount, render: (r) => (r.amount != null ? `$${r.amount.toFixed(2)}` : "") },
  { key: "total", label: "Running total", numeric: true, sortValue: (r) => r.runningTotal, render: (r) => (r.runningTotal != null ? `$${r.runningTotal.toFixed(2)}` : "") },
  { key: "initials", label: "Initials", sortValue: (r) => r.initials, render: (r) => <span className="font-sans">{r.initials}</span> },
];

export default function CashBoxTable({ entries }: { entries: CashEntry[] }) {
  return (
    <SortableTable
      columns={COLUMNS}
      rows={entries}
      getRowKey={(r, i) => `${r.date}-${i}`}
      defaultSortKey="date"
      defaultDirection="desc"
    />
  );
}

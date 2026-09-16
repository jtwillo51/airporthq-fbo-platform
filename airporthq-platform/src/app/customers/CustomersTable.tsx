"use client";

import SortableTable, { type Column } from "@/components/SortableTable";
import type { Customer } from "@/lib/data";

const COLUMNS: Column<Customer>[] = [
  { key: "tail", label: "Tail #", sortValue: (r) => r.tailNumber, render: (r) => <span className="font-sans">{r.tailNumber}</span> },
  { key: "type", label: "Type", sortValue: (r) => r.aircraftType, render: (r) => <span className="font-sans">{r.aircraftType}</span> },
  { key: "owner", label: "Owner", sortValue: (r) => r.owner, render: (r) => <span className="font-sans">{r.owner}</span> },
  { key: "attention", label: "Attention", sortValue: (r) => r.attention, render: (r) => <span className="font-sans">{r.attention}</span> },
  { key: "payment", label: "Payment", sortValue: (r) => r.paymentMethod, render: (r) => <span className="font-sans">{r.paymentMethod}</span> },
  { key: "rate", label: "Current $", numeric: true, sortValue: (r) => r.currentRate, render: (r) => r.currentRate },
  { key: "history", label: "Rate points on file", numeric: true, sortValue: (r) => r.rateHistory.length, render: (r) => r.rateHistory.length },
];

export default function CustomersTable({ customers }: { customers: Customer[] }) {
  return (
    <SortableTable columns={COLUMNS} rows={customers} getRowKey={(r) => r.tailNumber} defaultSortKey="owner" defaultDirection="asc" />
  );
}

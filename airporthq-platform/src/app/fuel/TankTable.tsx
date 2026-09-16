"use client";

import SortableTable, { type Column } from "@/components/SortableTable";
import type { TankDay } from "@/lib/data";

const COLUMNS: Column<TankDay>[] = [
  { key: "date", label: "Date", sortValue: (r) => r.date },
  { key: "start", label: "Start", numeric: true, sortValue: (r) => r.startInventoryGal, render: (r) => r.startInventoryGal },
  { key: "delivered", label: "Delivered", numeric: true, sortValue: (r) => r.gallonsDelivered, render: (r) => r.gallonsDelivered },
  { key: "pumped", label: "Pumped", numeric: true, sortValue: (r) => r.gallonsPumped, render: (r) => r.gallonsPumped },
  { key: "book", label: "Book Inv.", numeric: true, sortValue: (r) => r.bookInventoryGal, render: (r) => r.bookInventoryGal },
  { key: "stick", label: "Stick Inv.", numeric: true, sortValue: (r) => r.endStickGal, render: (r) => r.endStickGal },
  {
    key: "overshort",
    label: "Over/Short",
    numeric: true,
    sortValue: (r) => r.dailyOverShortGal,
    render: (r) => (
      <span
        style={{
          color:
            r.dailyOverShortGal != null && Math.abs(r.dailyOverShortGal) > 50
              ? "var(--color-danger)"
              : undefined,
        }}
      >
        {r.dailyOverShortGal}
      </span>
    ),
  },
  { key: "initials", label: "Initials", sortValue: (r) => r.initials, render: (r) => <span className="font-sans">{r.initials}</span> },
];

export default function TankTable({ rows }: { rows: TankDay[] }) {
  return (
    <SortableTable
      columns={COLUMNS}
      rows={rows}
      getRowKey={(r) => r.date}
      defaultSortKey="date"
      defaultDirection="desc"
    />
  );
}

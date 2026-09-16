"use client";

import SortableTable, { type Column } from "@/components/SortableTable";

interface FboTx {
  date: string;
  business: string | null;
  amount: number | null;
  description: string | null;
}
interface ShopTx {
  date: string;
  vendor: string | null;
  amount: number | null;
  referenceOrStock: string | null;
  tailNumberOrShop: string | null;
}

const FBO_COLUMNS: Column<FboTx>[] = [
  { key: "date", label: "Date", sortValue: (r) => r.date },
  { key: "business", label: "Business", sortValue: (r) => r.business, render: (r) => <span className="font-sans">{r.business}</span> },
  { key: "amount", label: "Amount", numeric: true, sortValue: (r) => r.amount, render: (r) => r.amount },
  { key: "description", label: "Description", sortValue: (r) => r.description, render: (r) => <span className="font-sans">{r.description}</span> },
];

const SHOP_COLUMNS: Column<ShopTx>[] = [
  { key: "date", label: "Date", sortValue: (r) => r.date },
  { key: "vendor", label: "Vendor", sortValue: (r) => r.vendor, render: (r) => <span className="font-sans">{r.vendor}</span> },
  { key: "amount", label: "Amount", numeric: true, sortValue: (r) => r.amount, render: (r) => r.amount },
  { key: "ref", label: "Ref/Stock", sortValue: (r) => r.referenceOrStock, render: (r) => <span className="font-sans">{r.referenceOrStock}</span> },
  { key: "shop", label: "Tail#/Shop", sortValue: (r) => r.tailNumberOrShop, render: (r) => <span className="font-sans">{r.tailNumberOrShop}</span> },
];

export function FboTable({ rows }: { rows: FboTx[] }) {
  return (
    <SortableTable
      columns={FBO_COLUMNS}
      rows={rows}
      getRowKey={(r, i) => `${r.date}-${i}`}
      defaultSortKey="date"
      defaultDirection="asc"
    />
  );
}

export function ShopTable({ rows }: { rows: ShopTx[] }) {
  return (
    <div className="max-h-[700px] overflow-y-auto">
      <SortableTable
        columns={SHOP_COLUMNS}
        rows={rows}
        getRowKey={(r, i) => `${r.date}-${i}`}
        defaultSortKey="date"
        defaultDirection="asc"
        stickyHeader
      />
    </div>
  );
}

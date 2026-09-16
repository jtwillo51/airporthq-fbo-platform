"use client";

import SortableTable, { type Column } from "@/components/SortableTable";
import type { LandingFee } from "@/lib/data";

const COLUMNS: Column<LandingFee>[] = [
  { key: "date", label: "Date", sortValue: (r) => r.date },
  { key: "tail", label: "Tail #", sortValue: (r) => r.tailNumber, render: (r) => <span className="font-sans">{r.tailNumber}</span> },
  { key: "landing", label: "Landing", numeric: true, sortValue: (r) => r.landingFee, render: (r) => r.landingFee },
  { key: "overnight", label: "Overnight", numeric: true, sortValue: (r) => r.overnightFee, render: (r) => r.overnightFee },
  { key: "tiedown", label: "Tie-down", numeric: true, sortValue: (r) => r.tieDownFee, render: (r) => r.tieDownFee },
  { key: "total", label: "Total", numeric: true, sortValue: (r) => r.total, render: (r) => r.total },
  { key: "tax", label: "Tax", numeric: true, sortValue: (r) => r.salesTax, render: (r) => r.salesTax },
  { key: "cc", label: "CC fees", numeric: true, sortValue: (r) => r.ccFees, render: (r) => r.ccFees },
  { key: "fbo", label: "FBO share", numeric: true, sortValue: (r) => r.fboShare, render: (r) => r.fboShare },
  { key: "airport", label: "Airport share", numeric: true, sortValue: (r) => r.airportShare, render: (r) => r.airportShare },
];

export default function LandingFeesTable({ records }: { records: LandingFee[] }) {
  return (
    <SortableTable
      columns={COLUMNS}
      rows={records}
      getRowKey={(r, i) => `${r.date}-${r.tailNumber}-${i}`}
      defaultSortKey="date"
      defaultDirection="asc"
    />
  );
}

"use client";

import SortableTable, { type Column } from "@/components/SortableTable";
import type { TimesheetDay } from "@/lib/data";

export default function TimesheetTable({
  employees,
  days,
}: {
  employees: string[];
  days: TimesheetDay[];
}) {
  const columns: Column<TimesheetDay>[] = [
    { key: "date", label: "Date", sortValue: (r) => r.date },
    { key: "day", label: "Day", sortValue: (r) => r.day, render: (r) => <span className="font-sans">{r.day}</span> },
    ...employees.map((emp): Column<TimesheetDay> => ({
      key: emp,
      label: emp,
      numeric: true,
      sortValue: (r) => r.hours[emp],
      render: (r) => r.hours[emp] ?? "–",
    })),
    { key: "onCall", label: "On call", sortValue: (r) => r.onCall, render: (r) => <span className="font-sans">{r.onCall}</span> },
  ];

  return (
    <SortableTable columns={columns} rows={days} getRowKey={(r) => r.date} defaultSortKey="date" defaultDirection="asc" />
  );
}

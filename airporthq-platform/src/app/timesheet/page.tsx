import PageHeader from "@/components/PageHeader";
import { getTimesheet } from "@/lib/data";
import TimesheetClient from "./TimesheetClient";

export default async function TimesheetPage() {
  const ts = await getTimesheet();

  return (
    <div>
      <PageHeader title="Timesheet" subtitle="Daily hours + on-call rotation" />
      <div className="p-8">
        <TimesheetClient employees={ts.employees} days={ts.days} />
      </div>
    </div>
  );
}

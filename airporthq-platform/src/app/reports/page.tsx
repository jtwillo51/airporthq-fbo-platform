import PageHeader from "@/components/PageHeader";
import { getMonthEnd } from "@/lib/data";
import { getPopularServices, getProfitRollup, getReportMonthsPresent } from "@/lib/reports";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const monthsPresent = await getReportMonthsPresent();
  const initialMonth = monthsPresent.at(-1) ?? new Date().toISOString().slice(0, 7);
  const [rollup, popular, monthEndFile] = await Promise.all([
    getProfitRollup({ month: initialMonth }),
    getPopularServices({ month: initialMonth }),
    getMonthEnd(),
  ]);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Derived fuel revenue, popular services, profit rollup" />
      <ReportsClient
        initial={{
          rollup,
          popular,
          monthsPresent,
          monthEnd: monthEndFile.months[initialMonth] ?? null,
        }}
        initialMonth={initialMonth}
      />
    </div>
  );
}

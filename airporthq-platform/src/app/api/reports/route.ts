import { NextResponse } from "next/server";
import { getMonthEnd } from "@/lib/data";
import { getPopularServices, getProfitRollup, getReportMonthsPresent } from "@/lib/reports";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? undefined;
  const allHistory = searchParams.get("allHistory") === "true";

  const [rollup, popular, monthsPresent, monthEndFile] = await Promise.all([
    getProfitRollup({ month, allHistory }),
    getPopularServices({ month, allHistory }),
    getReportMonthsPresent(),
    getMonthEnd(),
  ]);

  // A month-end close describes one specific month - there is nothing
  // meaningful to return for a multi-month range.
  const monthEnd = !allHistory && month ? (monthEndFile.months[month] ?? null) : null;

  return NextResponse.json({ rollup, popular, monthsPresent, monthEnd });
}

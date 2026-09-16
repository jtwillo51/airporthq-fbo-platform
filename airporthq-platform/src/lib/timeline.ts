import { readFile } from "node:fs/promises";
import path from "node:path";
import { clampMonths, clampRows, currentMonth, monthIsComplete } from "@/lib/clock";

const SHARED_DATA_DIR = path.join(process.cwd(), "..", "shared-data");

export interface TimelineTruckTx {
  date: string;
  tailNumberOrNote: string | null;
  gallons: number;
  truck: string;
  fuelType: "Jet A" | "100LL";
  synthetic?: boolean;
}
export interface TimelineMonth {
  month: string;
  synthetic: boolean;
  anomaly: string | null;
  costs: { jetAPerGal: number; avgasPerGal: number };
  retail: { jetAPerGal: number; avgasPerGal: number; jetASelfServePerGal: number };
  truckTransactions: TimelineTruckTx[];
  landingFees: { date: string; total: number | null; fboShare: number | null; airportShare: number | null }[];
  shopTransactions: { date: string; amount: number | null }[];
  fboCardTransactions: { date: string; amount: number | null }[];
  hangarSettlements: { arrivalDate: string; netRent: number | null; ownerShareAmount: number }[];
  timesheet: { date: string; hours: Record<string, number | null> }[];
  totals: { jetAGallons: number; avgasGallons: number };
}
interface TimelineFile {
  rangeStart: string;
  rangeEnd: string;
  syntheticMonths: string[];
  months: Record<string, TimelineMonth>;
}

let cache: TimelineFile | null = null;
async function loadTimeline(): Promise<TimelineFile> {
  if (!cache) {
    const raw = await readFile(path.join(SHARED_DATA_DIR, "timeline.json"), "utf-8");
    cache = JSON.parse(raw) as TimelineFile;
  }
  return cache;
}

/**
 * Every month that has actually started, with all rows clamped to today.
 * Future months are dropped entirely and the current month is truncated
 * mid-flight, so nothing that has not happened yet can be mistaken for
 * something that has.
 */
export async function getVisibleTimeline(): Promise<TimelineMonth[]> {
  const tl = await loadTimeline();
  const keys = clampMonths(Object.keys(tl.months).sort());

  return keys
    .map((k) => tl.months[k])
    .filter(Boolean)
    .map((m) => ({
      ...m,
      truckTransactions: clampRows(m.truckTransactions, "date"),
      landingFees: clampRows(m.landingFees, "date"),
      shopTransactions: clampRows(m.shopTransactions, "date"),
      fboCardTransactions: clampRows(m.fboCardTransactions, "date"),
      hangarSettlements: clampRows(m.hangarSettlements, "arrivalDate"),
      timesheet: clampRows(m.timesheet, "date"),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/** Months held back from display because they have not happened yet. */
export async function getHeldOutMonths(): Promise<string[]> {
  const tl = await loadTimeline();
  const cur = currentMonth();
  return Object.keys(tl.months).filter((m) => m > cur).sort();
}

/**
 * Future months, for scoring a forecast against ground truth. This is the ONLY
 * accessor that returns unclamped future data, and it must never feed a view
 * that presents figures as already-realised.
 */
export async function getHeldOutActuals(): Promise<TimelineMonth[]> {
  const tl = await loadTimeline();
  const cur = currentMonth();
  return Object.values(tl.months)
    .filter((m) => m.month > cur)
    .sort((a, b) => a.month.localeCompare(b.month));
}

export { monthIsComplete };

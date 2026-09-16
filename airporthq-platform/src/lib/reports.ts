import { getVisibleTimeline, type TimelineMonth } from "@/lib/timeline";
import { clampMonths } from "@/lib/clock";
import {
  getCcPurchases,
  getCustomerRates,
  getHangarSettlements,
  getLandingFees,
  getTruckLog,
  type Customer,
} from "@/lib/data";

export interface MonthFilter {
  month?: string; // "YYYY-MM" - omit or pass with allHistory=true to include everything loaded
  allHistory?: boolean;
}

function inMonth(dateStr: string | null | undefined, f: MonthFilter): boolean {
  if (f.allHistory || !f.month) return true;
  return !!dateStr && dateStr.slice(0, 7) === f.month;
}

// Derives fuel revenue by joining Trucks (gallons per tail # per date)
// against the customer-rates registry (rate in effect on that date) - see
// Design rule: "Rates never live-lookup." Confirmed approach with the
// client; the underlying rate registry's exact semantics are still flagged
// as unconfirmed (see customer-rates.json's _note).
export interface DerivedFuelTransaction {
  date: string;
  truck: "Truck #4" | "Truck #3";
  tailNumber: string;
  gallons: number;
  rate: number | null;
  revenue: number | null;
  matched: boolean;
}

const TAIL_RE = /^N\s?[0-9]/i;

function normalizeTail(s: string | null): string | null {
  if (!s) return null;
  const t = s.trim().toUpperCase();
  return TAIL_RE.test(t) ? t : null;
}

function findCustomer(customers: Customer[], tail: string): Customer | undefined {
  return customers.find((c) => c.tailNumber.trim().toUpperCase() === tail);
}

function rateAsOf(customer: Customer, date: string): number | null {
  // rateHistory is ordered most-recent-delivery-first (see conversion script).
  // Effective rate = most recent delivery on or before the transaction date.
  const hit = customer.rateHistory.find((h) => h.deliveryDate <= date);
  if (hit) return hit.rate;
  return customer.currentRate ?? null;
}

export async function getDerivedFuelTransactions(f: MonthFilter = {}): Promise<DerivedFuelTransaction[]> {
  const [trucks, rates] = await Promise.all([getTruckLog(), getCustomerRates()]);
  const out: DerivedFuelTransaction[] = [];

  for (const [truckKey, truck] of [
    ["Truck #4", trucks.truck4] as const,
    ["Truck #3", trucks.truck3] as const,
  ]) {
    for (const e of truck.entries) {
      if (!inMonth(e.date, f)) continue;
      const tail = normalizeTail(e.tailNumberOrNote);
      if (!tail || e.gallons == null || e.gallons <= 0) continue;
      const customer = findCustomer(rates.customers, tail);
      const rate = customer ? rateAsOf(customer, e.date) : null;
      out.push({
        date: e.date,
        truck: truckKey,
        tailNumber: tail,
        gallons: e.gallons,
        rate,
        revenue: rate != null ? Math.round(rate * e.gallons * 100) / 100 : null,
        matched: rate != null,
      });
    }
  }
  return out;
}

export interface ProfitRollup {
  fuel: { grossGallons: number; matchedRevenue: number; unmatchedGallons: number; unmatchedCount: number };
  // Split 80/20 after tax and card fees: the FBO keeps 80%, the airport
  // authority receives 20%. Only the FBO share counts toward net profit.
  landingFees: { total: number; fboShare: number; airportShare: number };
  hangar: { netRent: number; ownerShare: number; fboRetained: number };
  expenses: { fboCard: number; shopPurchases: number };
  netEstimate: number;
  caveats: string[];
}

export async function getProfitRollup(f: MonthFilter = {}): Promise<ProfitRollup> {
  const timeline = await getVisibleTimeline();
  const scoped =
    f.allHistory || !f.month ? timeline : timeline.filter((m) => m.month === f.month);

  if (scoped.length === 0) {
    return {
      fuel: { grossGallons: 0, matchedRevenue: 0, unmatchedGallons: 0, unmatchedCount: 0 },
      landingFees: { total: 0, fboShare: 0, airportShare: 0 },
      hangar: { netRent: 0, ownerShare: 0, fboRetained: 0 },
      expenses: { fboCard: 0, shopPurchases: 0 },
      netEstimate: 0,
      caveats: ["No data for this period."],
    };
  }
  if (scoped.length === 1) return rollupFromTimeline(scoped[0]);

  // Multi-month: sum the per-month rollups so one code path defines the math.
  const parts = scoped.map(rollupFromTimeline);
  const sum = (pick: (p: ProfitRollup) => number) => round2(parts.reduce((s, p) => s + pick(p), 0));
  return {
    fuel: {
      grossGallons: sum((p) => p.fuel.grossGallons),
      matchedRevenue: sum((p) => p.fuel.matchedRevenue),
      unmatchedGallons: 0,
      unmatchedCount: 0,
    },
    landingFees: {
      total: sum((p) => p.landingFees.total),
      fboShare: sum((p) => p.landingFees.fboShare),
      airportShare: sum((p) => p.landingFees.airportShare),
    },
    hangar: {
      netRent: sum((p) => p.hangar.netRent),
      ownerShare: sum((p) => p.hangar.ownerShare),
      fboRetained: sum((p) => p.hangar.fboRetained),
    },
    expenses: {
      fboCard: sum((p) => p.expenses.fboCard),
      shopPurchases: sum((p) => p.expenses.shopPurchases),
    },
    netEstimate: sum((p) => p.netEstimate),
    caveats: [
      "All figures are generated demo data, not a real operator's trading history.",
      `Covering ${scoped.length} months (${scoped[0].month} – ${scoped[scoped.length - 1].month}).`,
      "The maintenance shop appears as pure cost - parts spend is modelled but labour billing is not.",
    ],
  };
}

export interface PopularService {
  label: string;
  amount: number;
}

export async function getPopularServices(f: MonthFilter = {}): Promise<PopularService[]> {
  const rollup = await getProfitRollup(f);
  return [
    { label: "Fuel (derived)", amount: rollup.fuel.matchedRevenue },
    { label: "Landing / overnight / tie-down fees (FBO 80%)", amount: rollup.landingFees.fboShare },
    { label: "Hangar rent (FBO retained)", amount: rollup.hangar.fboRetained },
  ].sort((a, b) => b.amount - a.amount);
}

export async function getReportMonthsPresent(): Promise<string[]> {
  // The month selector spans every month that has actually started across the
  // merged real + synthetic timeline - not just the months that happen to
  // appear in the original single-month workbook conversion.
  const timeline = await getVisibleTimeline();
  return clampMonths(timeline.map((m) => m.month)).sort();
}

/**
 * Roll up a synthetic month straight from the timeline.
 *
 * The real month (July 2026) keeps the richer derivation in getProfitRollup -
 * joining truck logs against the customer rate registry - because that is what
 * the client's own records actually support. Synthetic months carry explicit
 * retail and wholesale figures, so their revenue is computed directly.
 */
function rollupFromTimeline(m: TimelineMonth): ProfitRollup {
  const jetGal = m.truckTransactions.filter((t) => t.fuelType === "Jet A").reduce((s, t) => s + t.gallons, 0);
  const avGal = m.truckTransactions.filter((t) => t.fuelType === "100LL").reduce((s, t) => s + t.gallons, 0);
  const fuelRevenue = round2(jetGal * m.retail.jetAPerGal + avGal * m.retail.avgasPerGal);

  const landingTotal = round2(m.landingFees.reduce((s, l) => s + (l.total ?? 0), 0));
  const landing80 = round2(m.landingFees.reduce((s, l) => s + (l.fboShare ?? 0), 0));
  const landing20 = round2(m.landingFees.reduce((s, l) => s + (l.airportShare ?? 0), 0));

  const hangarNet = round2(m.hangarSettlements.reduce((s, h) => s + (h.netRent ?? 0), 0));
  const hangarOwner = round2(m.hangarSettlements.reduce((s, h) => s + h.ownerShareAmount, 0));
  const hangarRetained = round2(hangarNet - hangarOwner);

  const fboCard = round2(m.fboCardTransactions.reduce((s, t) => s + (t.amount ?? 0), 0));
  const shop = round2(m.shopTransactions.reduce((s, t) => s + (t.amount ?? 0), 0));

  return {
    fuel: {
      grossGallons: round2(jetGal + avGal),
      matchedRevenue: fuelRevenue,
      unmatchedGallons: 0,
      unmatchedCount: 0,
    },
    landingFees: { total: landingTotal, fboShare: landing80, airportShare: landing20 },
    hangar: { netRent: hangarNet, ownerShare: hangarOwner, fboRetained: hangarRetained },
    expenses: { fboCard, shopPurchases: shop },
    netEstimate: round2(fuelRevenue + landing80 + hangarRetained - fboCard - shop),
    caveats: [
      "All figures are generated demo data, not a real operator's trading history.",
      "The maintenance shop appears as pure cost - parts spend is modelled but labour billing is not.",
    ],
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

import { getVisibleTimeline, monthIsComplete } from "@/lib/timeline";
import { getProfitability } from "@/lib/profitability";
import { currentMonth, todayISO } from "@/lib/clock";
import { getMonthEnd } from "@/lib/data";
import { SHOP_RATE_CARDS } from "@/lib/ai/shopRates";

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A compact, month-level summary of everything visible up to today.
 *
 * Deliberately aggregated rather than row-level: the model reasons better over
 * ~18 monthly rows than over thousands of transactions, and it keeps token
 * cost predictable. Anomaly detection still gets daily series separately.
 */
export async function buildMonthlyContext() {
  const [timeline, profit, monthEnd] = await Promise.all([
    getVisibleTimeline(),
    getProfitability({ allHistory: true }),
    getMonthEnd(),
  ]);

  const months = timeline.map((m) => {
    const jetGal = m.truckTransactions.filter((t) => t.fuelType === "Jet A").reduce((s, t) => s + t.gallons, 0);
    const avGal = m.truckTransactions.filter((t) => t.fuelType === "100LL").reduce((s, t) => s + t.gallons, 0);
    const fuelRev = jetGal * m.retail.jetAPerGal + avGal * m.retail.avgasPerGal;
    const fuelCost = jetGal * m.costs.jetAPerGal + avGal * m.costs.avgasPerGal;

    // Tank leak-check only exists once a month has fully closed - the close
    // summarizes the WHOLE month, so surfacing it for the current partial
    // month would leak days that haven't happened yet in demo time.
    const close = monthIsComplete(m.month) ? monthEnd.months[m.month] : undefined;
    const leakCheck = close
      ? {
          jetA: {
            totalOverShortGal: close.fuel.jetA.totalOverShortGal,
            thresholdGal: close.fuel.jetA.leakCheck.threshold,
            exceeded: close.fuel.jetA.leakCheck.exceeded,
            equation: close.fuel.jetA.leakCheck.equation,
          },
          avgas: {
            totalOverShortGal: close.fuel["100LL"].totalOverShortGal,
            thresholdGal: close.fuel["100LL"].leakCheck.threshold,
            exceeded: close.fuel["100LL"].leakCheck.exceeded,
            equation: close.fuel["100LL"].leakCheck.equation,
          },
        }
      : null;

    return {
      month: m.month,
      synthetic: m.synthetic,
      partial: m.month === currentMonth(),
      jetAGallons: r2(jetGal),
      avgasGallons: r2(avGal),
      jetARetailPerGal: m.retail.jetAPerGal,
      jetACostPerGal: m.costs.jetAPerGal,
      fuelRevenue: r2(fuelRev),
      estimatedFuelMargin: r2(fuelRev - fuelCost),
      // Cumulative fuel over/short vs. the leak-check threshold, per fuel
      // type. Null while the month is still open (see comment above).
      leakCheck,
      landingFeeGross: r2(m.landingFees.reduce((s, l) => s + (l.total ?? 0), 0)),
      landingMovements: m.landingFees.length,
      hangarNetRent: r2(m.hangarSettlements.reduce((s, h) => s + (h.netRent ?? 0), 0)),
      hangarStays: m.hangarSettlements.length,
      shopPartsSpend: r2(m.shopTransactions.reduce((s, t) => s + (t.amount ?? 0), 0)),
      // Total hours logged by all staff (fueling/line service included, not
      // shop-exclusive) - see the shop rate-card caveat in ANALYST_SYSTEM.
      totalStaffHours: r2(
        m.timesheet.reduce(
          (s, d) =>
            s + Object.values(d.hours ?? {}).reduce<number>((a, h) => a + (h ?? 0), 0),
          0
        )
      ),
    };
  });

  return {
    today: todayISO(),
    currentMonthIsPartial: true,
    allDataIsGenerated: true,
    months,
    profitability: {
      trucks: profit.trucks,
      services: profit.services,
      caveats: profit.caveats,
    },
    // Rate-card reference only, not billed revenue - see shopRates.ts. Given so
    // the model can put a rough, caveated order of magnitude on the shop's
    // missing labour billing instead of only flagging the gap.
    shopRateCards: SHOP_RATE_CARDS,
  };
}

/** Daily gallons + over/short series, for anomaly work that needs granularity. */
export async function buildDailyContext(month?: string) {
  const timeline = await getVisibleTimeline();
  const scoped = month ? timeline.filter((m) => m.month === month) : timeline.slice(-3);
  return scoped.map((m) => ({
    month: m.month,
    synthetic: m.synthetic,
    days: m.truckTransactions.reduce<Record<string, number>>((acc, t) => {
      acc[t.date] = r2((acc[t.date] ?? 0) + t.gallons);
      return acc;
    }, {}),
  }));
}

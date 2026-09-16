import { buildMonthlyContext } from "@/lib/ai/context";
import { getProfitability } from "@/lib/profitability";
import { median } from "./mathUtils";

/**
 * Everything the eval checks the model's output against, computed from
 * shared-data/ at run time rather than hand-typed. If the timeline
 * generator's parameters ever change, this re-derives instead of silently
 * checking against stale numbers.
 *
 * The THREE anomaly cases below are scaffolded on the months the generator
 * is documented to inject them into (scripts/generate_timeline.py: leak in
 * 2026-03, margin squeeze in 2026-01, shop overhaul in 2025-11) - that
 * month/type pairing is the test design, not a number. Everything else
 * (whether it actually tripped, by how much, vs. what baseline) is computed
 * here from the real data, and each case throws if the data no longer
 * backs up the case it's meant to test, rather than silently passing.
 */

export interface AnomalyCase {
  key: string;
  month: string;
  keywords: string[];
  evidence: string;
}

export interface GroundTruth {
  bestServiceLabel: string;
  bestTruckLabel: string;
  bestIsTruckBased: boolean;
  worstServiceLabel: string;
  worstTruckLabel: string;
  worstIsTruckBased: boolean;
  anomalies: AnomalyCase[];
  monthly: Awaited<ReturnType<typeof buildMonthlyContext>>;
}

const TRUCK_BASED_SERVICE_LABELS = new Set(["Jet A fuel", "100LL fuel"]);

export async function deriveGroundTruth(): Promise<GroundTruth> {
  const [monthly, profit] = await Promise.all([
    buildMonthlyContext(),
    getProfitability({ allHistory: true }),
  ]);

  const anomalies: AnomalyCase[] = [];

  // --- Leak: the month whose JET A leak-check tripped ---
  // Deliberately Jet A only, not "either fuel": the generator's own
  // self-check (scripts/generate_timeline.py, bottom) only validates the Jet
  // A leak check. 100LL trips the same threshold formula in a couple of
  // other months too (confirmed by running this deriver), but that's
  // incidental noise from the random walk on a much smaller tank, not the
  // designed anomaly - a good answer isn't expected to flag it, and
  // requiring it here would fail even a correct model.
  const leakMonths = monthly.months.filter((m) => m.leakCheck?.jetA.exceeded);
  if (leakMonths.length === 0) {
    throw new Error(
      "Ground truth: expected exactly one month to trip the Jet A leak-check, found none. Has the generator's leak injection changed?"
    );
  }
  for (const m of leakMonths) {
    const lc = m.leakCheck!.jetA;
    anomalies.push({
      key: `leak-${m.month}`,
      month: m.month,
      keywords: ["leak", "over/short", "over short", "overshort", "tank"],
      evidence: `jetA cumulative over/short ${lc.totalOverShortGal} gal vs. threshold ${lc.thresholdGal} gal (${lc.equation})`,
    });
  }

  // --- Margin squeeze: the month with the lowest Jet A margin/gallon ---
  const jetMonths = monthly.months.filter((m) => m.jetAGallons > 0);
  const margins = jetMonths.map((m) => ({
    month: m.month,
    marginPerGal: Math.round((m.jetARetailPerGal - m.jetACostPerGal) * 100) / 100,
  }));
  const medMargin = median(margins.map((x) => x.marginPerGal));
  const worstMargin = margins.reduce((min, cur) => (cur.marginPerGal < min.marginPerGal ? cur : min));
  if (worstMargin.marginPerGal > medMargin * 0.75) {
    throw new Error(
      `Ground truth: no month's Jet A margin/gal looks like a real squeeze relative to the $${medMargin.toFixed(2)} median. Has the generator's margin-squeeze injection changed?`
    );
  }
  anomalies.push({
    key: `margin-squeeze-${worstMargin.month}`,
    month: worstMargin.month,
    keywords: ["margin", "wholesale", "squeeze", "cost"],
    evidence: `Jet A margin fell to $${worstMargin.marginPerGal}/gal vs. a $${medMargin.toFixed(2)}/gal median across the period`,
  });

  // --- Overhaul: the month with the highest shop parts spend ---
  const spends = monthly.months.map((m) => ({ month: m.month, spend: m.shopPartsSpend }));
  const medSpend = median(spends.map((x) => x.spend));
  const topSpend = spends.reduce((max, cur) => (cur.spend > max.spend ? cur : max));
  if (topSpend.spend < medSpend * 1.8) {
    throw new Error(
      `Ground truth: no month's shop parts spend looks like a real spike relative to the $${medSpend.toFixed(2)} median. Has the generator's overhaul injection changed?`
    );
  }
  anomalies.push({
    key: `overhaul-${topSpend.month}`,
    month: topSpend.month,
    keywords: ["overhaul", "parts", "shop"],
    evidence: `Shop parts spend $${topSpend.spend} vs. a $${medSpend.toFixed(2)} median across the period`,
  });

  const bestServiceLabel = profit.best.services?.label ?? "";
  const worstServiceLabel = profit.worst.services?.label ?? "";

  return {
    bestServiceLabel,
    bestTruckLabel: profit.best.trucks?.label ?? "",
    bestIsTruckBased: TRUCK_BASED_SERVICE_LABELS.has(bestServiceLabel),
    worstServiceLabel,
    worstTruckLabel: profit.worst.trucks?.label ?? "",
    worstIsTruckBased: TRUCK_BASED_SERVICE_LABELS.has(worstServiceLabel),
    anomalies,
    monthly,
  };
}

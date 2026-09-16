import { median, round } from "./mathUtils";

export interface FlaggedNumber {
  raw: string;
  value: number;
  field: string;
}

/**
 * Heuristic "did it invent a number" check, not a proof.
 *
 * An earlier version of this derived every pairwise sum/product/ratio of
 * sibling fields anywhere in the payload, which produced ~14,000 grounding
 * values spread densely enough that a made-up test figure ("$58,432", a
 * "217%" jump) matched one within 1% by pure coincidence - a negative
 * control caught this before any real eval run spent API credits on it. The
 * fix is to keep the derived tiers small and semantically deliberate rather
 * than combinatorial:
 *
 * Tier 1: exact atoms - every number that appears anywhere in the JSON sent
 * to the model, plus known constants the model is TOLD directly in
 * ANALYST_SYSTEM (the 80/20 fee split, 5% tax, etc.) and calendar years.
 * Tier 2: sum/difference of a month's own sibling fields only (e.g. two
 * fees adding to a total) - no products or ratios here, since those explode
 * range fastest for the least realistic payoff.
 * Tier 3: a handful of named month-over-month series (margin/gal, shop
 * spend, gallons, revenue) with adjacent-month and vs.-median deltas AND
 * percent-changes - this is where "margin fell 44% from Dec to Jan" lives,
 * deliberately scoped instead of generic.
 * Tier 4: each profitability line's share of the total (e.g. "Jet A is 81%
 * of total margin"), since that phrasing shows up constantly in this kind
 * of summary and tier 1-3 don't cover it.
 *
 * Tolerance is tight (0.3%, floor 0.15) on purpose - loosen it and the
 * check stops meaning anything, per the negative-control failure above.
 *
 * Measured, not assumed: against a 4-figure fabricated paragraph (a made-up
 * percent jump, a 7-digit dollar total, a made-up per-truck total, a
 * suspiciously round quarterly figure) this catches 2 of 4 and produces 0
 * false positives against the real hand-authored reference text. It's
 * reliable against numbers that are simply wrong (wrong order of magnitude,
 * or in an empty region of the number line) and unreliable against a
 * fabricated number that happens to land within ~0.3% of some real or
 * derived figure by chance - percent-change combinations are the main
 * source of that risk, since dividing by a small base can put them almost
 * anywhere. Treat a "PASS" here as "nothing obviously wrong found", not "no
 * numbers were invented" - flagged numbers are for a human to spot-check,
 * clean runs are not proof of a clean answer.
 */

function collectAtoms(val: unknown, out: Set<number>) {
  if (typeof val === "number" && Number.isFinite(val)) out.add(round(val));
  else if (Array.isArray(val)) val.forEach((v) => collectAtoms(v, out));
  else if (val && typeof val === "object") Object.values(val).forEach((v) => collectAtoms(v, out));
}

/** Sum/difference only, and only among a single object's own direct numeric fields - not products, not ratios, not recursed-in descendants. */
function deriveDirectFieldSumsAndDiffs(val: unknown, out: Set<number>) {
  if (Array.isArray(val)) {
    val.forEach((v) => deriveDirectFieldSumsAndDiffs(v, out));
    return;
  }
  if (!val || typeof val !== "object") return;
  const nums = Object.values(val).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      out.add(round(nums[i] + nums[j]));
      out.add(round(nums[i] - nums[j]));
      out.add(round(nums[j] - nums[i]));
    }
  }
  Object.values(val).forEach((v) => deriveDirectFieldSumsAndDiffs(v, out));
}

interface MonthlyRow {
  month: string;
  jetARetailPerGal: number;
  jetACostPerGal: number;
  shopPartsSpend: number;
  jetAGallons: number;
  avgasGallons: number;
  fuelRevenue: number;
  estimatedFuelMargin: number;
}

interface ProfitLine {
  margin: number;
  revenue: number;
}

interface MonthlyContext {
  months: MonthlyRow[];
  profitability?: { services?: ProfitLine[]; trucks?: ProfitLine[] };
}

function deriveMonthlySeries(months: MonthlyRow[], out: Set<number>) {
  const series: Record<string, number[]> = {
    jetMarginPerGal: months.map((m) => round(m.jetARetailPerGal - m.jetACostPerGal)),
    shopPartsSpend: months.map((m) => m.shopPartsSpend),
    jetAGallons: months.map((m) => m.jetAGallons),
    avgasGallons: months.map((m) => m.avgasGallons),
    fuelRevenue: months.map((m) => m.fuelRevenue),
    estimatedFuelMargin: months.map((m) => m.estimatedFuelMargin),
  };

  for (const vals of Object.values(series)) {
    vals.forEach((v) => out.add(round(v)));
    for (let i = 1; i < vals.length; i++) {
      const prev = vals[i - 1];
      const cur = vals[i];
      out.add(round(cur - prev));
      out.add(round(prev - cur));
      if (prev !== 0) out.add(round(((cur - prev) / prev) * 100));
      if (cur !== 0) out.add(round(((prev - cur) / cur) * 100));
    }
    const med = median(vals);
    vals.forEach((v) => {
      out.add(round(v - med));
      if (med !== 0) out.add(round(((v - med) / med) * 100));
    });
  }
}

/**
 * "X is N% of total margin/revenue" - common phrasing this specifically
 * covers. The denominator sums only the positive lines: with a loss-making
 * line (the shop) in the mix, including it would let a share exceed 100% or
 * flip sign, which isn't how anyone actually talks about "share of profit" -
 * confirmed against the hand-authored reference copy's own "roughly 81%"
 * figure, which only reconciles against the positive-only sum.
 */
function deriveShareOfTotal(lines: ProfitLine[] | undefined, out: Set<number>) {
  if (!lines?.length) return;
  for (const key of ["margin", "revenue"] as const) {
    const total = lines.reduce((s, l) => s + Math.max(0, l[key]), 0);
    if (total === 0) continue;
    for (const l of lines) {
      if (l[key] <= 0) continue;
      out.add(round((l[key] / total) * 100));
    }
  }
}

// Business-rule constants the model is TOLD directly in ANALYST_SYSTEM, plus
// small integers (counts, "3 months") - never present as a raw field, always
// legitimate to cite.
const KNOWN_CONSTANTS = [0, 1, 2, 3, 4, 5, 3.5, 10, 20, 30, 70, 80, 90, 100, 0.01, 130];

export function buildGroundingSet(monthly: MonthlyContext, daily: unknown): Set<number> {
  const grounding = new Set<number>();
  collectAtoms(monthly, grounding);
  collectAtoms(daily, grounding);
  KNOWN_CONSTANTS.forEach((n) => grounding.add(n));
  monthly.months.forEach((m) => grounding.add(Number(m.month.slice(0, 4)))); // calendar years, e.g. 2026

  deriveDirectFieldSumsAndDiffs(monthly, grounding);
  deriveDirectFieldSumsAndDiffs(daily, grounding);
  deriveMonthlySeries(monthly.months, grounding);
  deriveShareOfTotal(monthly.profitability?.services, grounding);
  deriveShareOfTotal(monthly.profitability?.trucks, grounding);

  return grounding;
}

function isGrounded(candidate: number, grounding: Set<number>): boolean {
  for (const g of grounding) {
    const tol = Math.max(0.15, Math.abs(g) * 0.003);
    if (Math.abs(candidate - g) <= tol) return true;
  }
  return false;
}

// Excludes anything preceded/followed by a letter or digit, so it won't
// grab "858" out of a tail number like N858LR.
const NUMBER_RE = /(?<![\w.])-?\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?%?(?!\w)/g;
const YEAR_MONTH_RE = /\b(19|20)\d{2}-\d{2}(-\d{2})?\b/g;

function extractCandidates(text: string): { raw: string; value: number }[] {
  const cleaned = text.replace(YEAR_MONTH_RE, " ");
  const out: { raw: string; value: number }[] = [];
  for (const m of cleaned.matchAll(NUMBER_RE)) {
    const raw = m[0];
    const value = parseFloat(raw.replace(/[$,%]/g, ""));
    if (Number.isFinite(value)) out.push({ raw, value });
  }
  return out;
}

export function auditNumbers(fields: Record<string, string>, grounding: Set<number>): FlaggedNumber[] {
  const flagged: FlaggedNumber[] = [];
  for (const [field, text] of Object.entries(fields)) {
    for (const { raw, value } of extractCandidates(text)) {
      if (!isGrounded(value, grounding)) flagged.push({ raw, value, field });
    }
  }
  return flagged;
}

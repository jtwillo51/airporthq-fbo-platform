import type { Insights } from "@/lib/ai/insights";
import type { GroundTruth } from "./groundTruth";

export interface CheckResult {
  name: string;
  pass: boolean;
  detail: string;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const STOPWORDS = new Set(["the", "fuel", "and", "a", "of", "rental", "fees", "ramp", "landing", "service", "line"]);

function significantTokens(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/** Loose match: does the model's free-text label share a meaningful word with the ground-truth label? */
function labelMatches(actual: string, expectedLabel: string): boolean {
  const want = significantTokens(expectedLabel);
  const have = normalize(actual);
  return want.some((t) => have.includes(t));
}

function truckNumberMatches(actual: string | null, expectedLabel: string): boolean {
  if (!actual) return false;
  const num = expectedLabel.match(/#?(\d+)/)?.[1];
  if (!num) return false;
  return new RegExp(`truck\\s*#?\\s*${num}\\b`, "i").test(actual);
}

function textMentionsAny(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

export function runChecks(insights: Insights, gt: GroundTruth): CheckResult[] {
  const results: CheckResult[] = [];

  for (const a of gt.anomalies) {
    const hit = insights.anomalies.find(
      (x) => x.month === a.month && textMentionsAny(`${x.title} ${x.detail}`, a.keywords)
    );
    results.push({
      name: `anomaly:${a.key}`,
      pass: !!hit,
      detail: hit
        ? `found - "${hit.title}"`
        : `missing - expected an anomaly in ${a.month} mentioning one of [${a.keywords.join(", ")}]. Ground truth: ${a.evidence}`,
    });
  }

  results.push({
    name: "most-profitable-service",
    pass: labelMatches(insights.mostProfitable.service, gt.bestServiceLabel),
    detail: `model said "${insights.mostProfitable.service}", ground truth is "${gt.bestServiceLabel}"`,
  });

  results.push({
    name: "most-profitable-truck",
    pass: gt.bestIsTruckBased
      ? truckNumberMatches(insights.mostProfitable.truck, gt.bestTruckLabel)
      : insights.mostProfitable.truck === null,
    detail: gt.bestIsTruckBased
      ? `model said ${JSON.stringify(insights.mostProfitable.truck)}, ground truth is "${gt.bestTruckLabel}"`
      : `expected null (not a truck-based line), model said ${JSON.stringify(insights.mostProfitable.truck)}`,
  });

  results.push({
    name: "least-profitable-service",
    pass: labelMatches(insights.leastProfitable.service, gt.worstServiceLabel),
    detail: `model said "${insights.leastProfitable.service}", ground truth is "${gt.worstServiceLabel}"`,
  });

  // Regression guard for the bug where the schema forced a truck onto every
  // line, including the maintenance shop (see InsightsClient.tsx history).
  results.push({
    name: "least-profitable-truck-null",
    pass: gt.worstIsTruckBased
      ? truckNumberMatches(insights.leastProfitable.truck, gt.worstTruckLabel)
      : insights.leastProfitable.truck === null,
    detail: gt.worstIsTruckBased
      ? `model said ${JSON.stringify(insights.leastProfitable.truck)}, ground truth is "${gt.worstTruckLabel}"`
      : `expected null (the shop isn't truck-based), model said ${JSON.stringify(insights.leastProfitable.truck)}`,
  });

  return results;
}

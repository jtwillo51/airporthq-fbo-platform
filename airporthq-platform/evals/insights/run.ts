import "./loadEnv";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateLiveInsights } from "@/lib/ai/insights";
import { buildDailyContext } from "@/lib/ai/context";
import { deriveGroundTruth } from "./groundTruth";
import { runChecks, type CheckResult } from "./checks";
import { auditNumbers, buildGroundingSet } from "./numberAudit";

/**
 * Eval for /api/ai/insights. Calls the LIVE model - this spends real
 * ANTHROPIC_API_KEY credits, once per run, and is why it isn't part of `npm
 * run build`/CI. Run with: `npm run eval:insights`.
 *
 * Prints a pass/fail line per check and a "N/M checks passed" score, writes
 * the full run to evals/insights/results/<timestamp>.json, and compares
 * against evals/insights/baseline.json (creating it on the first run).
 */

const evalDir = fileURLToPath(new URL(".", import.meta.url));

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "ANTHROPIC_API_KEY is not set (checked .env and .env.local). This eval calls the live model and needs a funded key."
    );
    process.exitCode = 1;
    return;
  }

  console.log("Calling the live model for /api/ai/insights (this spends real API credits)...\n");

  const [insights, gt, daily] = await Promise.all([
    generateLiveInsights(),
    deriveGroundTruth(),
    buildDailyContext(),
  ]);

  if (!insights) {
    console.error("FAIL: model returned no structured output (likely cut off by max_tokens).");
    process.exitCode = 1;
    return;
  }

  const structuralChecks = runChecks(insights, gt);

  const grounding = buildGroundingSet(gt.monthly, daily);
  const numberFields: Record<string, string> = {
    summary: insights.summary,
    "mostProfitable.why": insights.mostProfitable.why,
    "leastProfitable.why": insights.leastProfitable.why,
  };
  insights.anomalies.forEach((a, i) => {
    numberFields[`anomalies[${i}]`] = `${a.title} ${a.detail}`;
  });
  insights.watchList.forEach((w, i) => {
    numberFields[`watchList[${i}]`] = w;
  });
  // shopLaborEstimate is deliberately excluded: it's designed to produce a
  // caveated estimate that ISN'T in the source data, so auditing it against
  // "is this number in the data" would penalize the feature for working.
  const flagged = auditNumbers(numberFields, grounding);
  const numberCheck: CheckResult = {
    name: "no-invented-numbers",
    pass: flagged.length === 0,
    detail:
      flagged.length === 0
        ? "no ungrounded numbers found (heuristic - see numberAudit.ts for what this does and doesn't catch)"
        : `${flagged.length} flagged for manual review: ${flagged.map((f) => `${f.raw} (in ${f.field})`).join(", ")}`,
  };

  const allChecks = [...structuralChecks, numberCheck];
  const passed = allChecks.filter((c) => c.pass).length;

  console.log("=== Insights eval ===");
  for (const c of allChecks) {
    console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}\n      ${c.detail}`);
  }
  const pct = Math.round((passed / allChecks.length) * 100);
  console.log(`\nScore: ${passed}/${allChecks.length} checks passed (${pct}%)`);

  const result = {
    ranAt: new Date().toISOString(),
    score: { passed, total: allChecks.length },
    checks: allChecks,
    shopLaborEstimate: insights.shopLaborEstimate,
    rawInsights: insights,
  };

  const resultsDir = path.join(evalDir, "results");
  mkdirSync(resultsDir, { recursive: true });
  const stamp = result.ranAt.replace(/[:.]/g, "-");
  const resultPath = path.join(resultsDir, `${stamp}.json`);
  writeFileSync(resultPath, JSON.stringify(result, null, 2));
  console.log(`\nFull result written to ${path.relative(process.cwd(), resultPath)}`);

  const baselinePath = path.join(evalDir, "baseline.json");
  if (!existsSync(baselinePath)) {
    writeFileSync(baselinePath, JSON.stringify(result, null, 2));
    console.log(`No baseline existed yet - this run is now the committed baseline: ${path.relative(process.cwd(), baselinePath)}`);
  } else {
    const baseline = JSON.parse(readFileSync(baselinePath, "utf-8")) as typeof result;
    console.log(`Baseline (${baseline.ranAt}): ${baseline.score.passed}/${baseline.score.total} passed`);
    if (result.score.passed < baseline.score.passed) {
      console.log("REGRESSION vs. baseline.");
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error("Eval run failed:", err);
  process.exitCode = 1;
});

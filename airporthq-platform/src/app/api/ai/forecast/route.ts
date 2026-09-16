import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ANALYST_SYSTEM, MODEL, getClient, isDemoMode } from "@/lib/ai/client";
import { MOCK_FORECAST, MOCK_LATENCY_MS, sleep } from "@/lib/ai/mock";
import { buildMonthlyContext } from "@/lib/ai/context";
import { getHeldOutActuals } from "@/lib/timeline";

export const maxDuration = 60;

const ForecastSchema = z.object({
  method: z.string().describe("One sentence on how the projection was reached."),
  months: z.array(
    z.object({
      month: z.string().describe("YYYY-MM being projected."),
      jetAGallons: z.number(),
      avgasGallons: z.number(),
      fuelRevenue: z.number(),
      confidence: z.enum(["low", "medium", "high"]),
      reasoning: z.string().describe("Why this number, in one short sentence."),
    })
  ),
  priceGuidance: z
    .string()
    .describe("What the operator should consider doing with posted fuel pricing, and why."),
  risks: z.array(z.string()).describe("Up to three things that would break this projection."),
});

export async function POST(request: Request) {
  const bodyRaw = (await request.json().catch(() => ({}))) as { horizon?: number; score?: boolean };

  if (isDemoMode()) {
    await sleep(MOCK_LATENCY_MS.forecast);
    let scoring: unknown = null;
    if (bodyRaw.score) {
      // Scored against the same held-out months the live path uses, so the
      // demo's error figures are real arithmetic rather than invented.
      const actuals = await getHeldOutActuals();
      scoring = MOCK_FORECAST.months.map((f) => {
        const actual = actuals.find((a) => a.month === f.month);
        if (!actual) return { month: f.month, actualAvailable: false };
        const actualGal = actual.totals.jetAGallons;
        return {
          month: f.month,
          actualAvailable: true,
          forecastJetAGallons: f.jetAGallons,
          actualJetAGallons: actualGal,
          errorPct: actualGal
            ? Math.round(((f.jetAGallons - actualGal) / actualGal) * 1000) / 10
            : null,
        };
      });
    }
    return Response.json({ mode: "demo", forecast: MOCK_FORECAST, scoring });
  }

  try {
    const body = bodyRaw;
    const horizon = Math.min(Math.max(body.horizon ?? 3, 1), 6);

    const monthly = await buildMonthlyContext();

    const response = await getClient().messages.parse({
      model: MODEL,
      max_tokens: 8000,
      system: ANALYST_SYSTEM,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: `Project the next ${horizon} month(s) of fuel demand and revenue for this FBO.

This is a seasonal mountain-airport operation: summer is busy, deep winter is quiet. Use the seasonality visible in the history rather than extrapolating a straight line. Note that the latest month in the data is PARTIAL - it stops at today - so do not treat its lower total as a decline.

Give a per-month figure with a confidence level, then say what you would do about posted pricing.

HISTORY:
${JSON.stringify(monthly, null, 2)}`,
        },
      ],
      output_config: { format: zodOutputFormat(ForecastSchema) },
    });

    if (!response.parsed_output) {
      return Response.json({ error: "Model returned no structured output." }, { status: 502 });
    }

    // Optional accuracy scoring against the held-out future months. This is
    // the demo's honesty check: the model never sees these figures, so the
    // comparison is a genuine out-of-sample test rather than a restatement.
    let scoring: unknown = null;
    if (body.score) {
      const actuals = await getHeldOutActuals();
      scoring = response.parsed_output.months.map((f) => {
        const actual = actuals.find((a) => a.month === f.month);
        if (!actual) return { month: f.month, actualAvailable: false };
        const actualGal = actual.totals.jetAGallons;
        const errPct = actualGal ? ((f.jetAGallons - actualGal) / actualGal) * 100 : null;
        return {
          month: f.month,
          actualAvailable: true,
          forecastJetAGallons: f.jetAGallons,
          actualJetAGallons: actualGal,
          errorPct: errPct === null ? null : Math.round(errPct * 10) / 10,
        };
      });
    }

    return Response.json({ mode: "live", forecast: response.parsed_output, scoring });
  } catch (err) {
    console.error("[ai/forecast]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Forecast failed: ${message}` }, { status: 500 });
  }
}

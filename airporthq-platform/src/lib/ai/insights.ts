import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ANALYST_SYSTEM, MODEL, getClient } from "@/lib/ai/client";
import { buildDailyContext, buildMonthlyContext } from "@/lib/ai/context";

/**
 * Schema and live-generation logic for the business-insights panel.
 *
 * Pulled out of the route handler so the eval harness (evals/insights) can
 * call the exact same prompt/schema the app calls in production, rather than
 * a reimplementation that could drift from it.
 */
export const InsightsSchema = z.object({
  summary: z
    .string()
    .describe("Two or three sentences on how the business is actually doing, in plain language."),
  anomalies: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string().describe("What is unusual, with the figures that show it."),
        severity: z.enum(["low", "medium", "high"]),
        month: z.string().describe("The YYYY-MM the anomaly occurs in."),
      })
    )
    .describe("Genuinely unusual movements. Return an empty array if nothing stands out."),
  mostProfitable: z.object({
    service: z.string(),
    why: z.string(),
    truck: z
      .string()
      .nullable()
      .describe("The specific fuel truck, only when the service is a fuel line (Jet A or 100LL). Null for landing fees, hangar rental, or the maintenance shop - they aren't truck-based."),
  }),
  leastProfitable: z.object({
    service: z.string(),
    why: z.string(),
    truck: z
      .string()
      .nullable()
      .describe("The specific fuel truck, only when the service is a fuel line (Jet A or 100LL). Null for landing fees, hangar rental, or the maintenance shop - they aren't truck-based."),
  }),
  watchList: z
    .array(z.string())
    .max(4)
    .describe("Up to four short, concrete things the operator should keep an eye on."),
  shopLaborEstimate: z
    .object({
      approxRange: z
        .string()
        .describe("A rough, explicitly-caveated dollar range for what the shop's uncaptured labour billing might be worth, derived from the rate card and recorded staff hours. e.g. '$40,000-$60,000 over the period, very approximate.'"),
      basis: z
        .string()
        .describe("The assumption the estimate rests on (e.g. what share of recorded hours you assumed were billable shop repair time, and why)."),
    })
    .nullable()
    .describe("Only populate if the rate card and recorded hours support a defensible rough estimate. Null if there isn't enough basis for even a rough number."),
});

export type Insights = z.infer<typeof InsightsSchema>;

const INSIGHTS_PROMPT = `Review this FBO's operating data and report what stands out.

Rank which service line is earning the most and which is earning the least, and say plainly why. Only fill in a truck when the line is a fuel line (Jet A or 100LL) - leave it null for landing fees, hangar rental, or the maintenance shop. Remember the maintenance shop looks cost-only because labour billing is missing from the source - do not call it the least profitable on that basis without saying that is a data gap. Use the shop rate card (in MONTHLY DATA, under shopRateCards) plus recorded staff hours to give a rough, explicitly-caveated dollar estimate of what that missing labour billing might be worth in shopLaborEstimate - only if you have a defensible basis for one, otherwise leave it null.

Flag anomalies only where the numbers genuinely warrant it. The current month is partial (data stops at today), so do not report it as a downturn.`;

/**
 * Calls the live model and returns its parsed, schema-validated output, or
 * null if the model produced no structured output (e.g. cut off by
 * max_tokens). Throws on request-level failures (network, API errors).
 */
export async function generateLiveInsights(): Promise<Insights | null> {
  const [monthly, daily] = await Promise.all([buildMonthlyContext(), buildDailyContext()]);

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: ANALYST_SYSTEM,
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: `${INSIGHTS_PROMPT}

MONTHLY DATA:
${JSON.stringify(monthly, null, 2)}

DAILY FUEL VOLUME (recent months):
${JSON.stringify(daily, null, 2)}`,
      },
    ],
    output_config: { format: zodOutputFormat(InsightsSchema) },
  });

  return response.parsed_output ?? null;
}

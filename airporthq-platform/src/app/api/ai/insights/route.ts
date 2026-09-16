import { isDemoMode } from "@/lib/ai/client";
import { generateLiveInsights } from "@/lib/ai/insights";
import { MOCK_INSIGHTS, MOCK_LATENCY_MS, sleep } from "@/lib/ai/mock";

export const maxDuration = 60;

export async function POST() {
  // No key -> scripted demo response, clearly tagged so the UI can say so.
  if (isDemoMode()) {
    await sleep(MOCK_LATENCY_MS.insights);
    return Response.json({ mode: "demo", insights: MOCK_INSIGHTS });
  }

  try {
    const insights = await generateLiveInsights();
    if (!insights) {
      return Response.json({ error: "Model returned no structured output." }, { status: 502 });
    }
    return Response.json({ mode: "live", insights });
  } catch (err) {
    console.error("[ai/insights]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Insight generation failed: ${message}` }, { status: 500 });
  }
}

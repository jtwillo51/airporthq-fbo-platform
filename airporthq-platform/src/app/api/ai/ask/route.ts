import { ANALYST_SYSTEM, MODEL, getClient, isDemoMode } from "@/lib/ai/client";
import { buildMonthlyContext } from "@/lib/ai/context";
import { MOCK_LATENCY_MS, PRESET_QUESTIONS, sleep } from "@/lib/ai/mock";

export const maxDuration = 60;

/**
 * "Ask your data" - streams a plain-language answer grounded in the visible
 * operating data. Streamed so long answers render progressively instead of
 * sitting behind a spinner.
 */
export async function POST(request: Request) {
  const { question, presetId } = (await request.json().catch(() => ({}))) as {
    question?: string;
    presetId?: string;
  };

  // Demo mode answers the scripted questions and declines anything else,
  // rather than pretending to reason about a question it has no answer for.
  if (isDemoMode()) {
    await sleep(MOCK_LATENCY_MS.ask);
    const preset = PRESET_QUESTIONS.find(
      (p) => p.id === presetId || p.question.toLowerCase() === (question ?? "").trim().toLowerCase()
    );
    const text = preset
      ? preset.answer
      : "Sample mode answers only the suggested questions above, so there is no scripted response for this one. Set AI_MODE=live with a funded ANTHROPIC_API_KEY to ask anything you like about the data.";
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-AI-Mode": "demo",
      },
    });
  }

  const q = (question ?? "").trim();
  if (!q) return Response.json({ error: "Ask a question first." }, { status: 400 });
  if (q.length > 500) {
    return Response.json({ error: "Question is too long (500 characters max)." }, { status: 400 });
  }

  try {
    const monthly = await buildMonthlyContext();

    const stream = getClient().messages.stream({
      model: MODEL,
      max_tokens: 4000,
      system: ANALYST_SYSTEM,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: `Operating data (everything visible up to today):

${JSON.stringify(monthly, null, 2)}

Question: ${q}

Answer from this data alone. If it cannot be answered from what is here, say exactly what is missing rather than estimating. Keep it short.`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          console.error("[ai/ask] stream", err);
          controller.enqueue(encoder.encode("\n\n[The answer was cut off by an error.]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[ai/ask]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Question failed: ${message}` }, { status: 500 });
  }
}

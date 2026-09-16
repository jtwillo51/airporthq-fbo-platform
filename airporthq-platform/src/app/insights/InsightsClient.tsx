"use client";

import { useState } from "react";
import Flag from "@/components/Flag";
import { AiBadge, useAiCall } from "@/components/AiPanel";
import PlaneProgress from "@/components/PlaneProgress";

const PRESET_QUESTIONS = [
  { id: "weakest-margin", label: "Weakest fuel margin?", question: "Which month had the weakest fuel margin, and why?" },
  { id: "shop-losing-money", label: "Is the shop losing money?", question: "Is the maintenance shop actually losing money?" },
  { id: "leak-check", label: "Why did the leak check trip?", question: "Why did the Jet A tank trip the leak check in March?" },
  { id: "price-jet-a", label: "What should I charge for Jet A?", question: "What should I charge for Jet A next month?" },
  { id: "truck-comparison", label: "Which truck earns more?", question: "Which truck earns more, and by how much?" },
  { id: "winter-vs-summer", label: "What does winter cost us?", question: "How much does winter actually cost us?" },
];

interface Insights {
  summary: string;
  anomalies: { title: string; detail: string; severity: "low" | "medium" | "high"; month: string }[];
  mostProfitable: { service: string; why: string; truck: string | null };
  leastProfitable: { service: string; why: string; truck: string | null };
  watchList: string[];
  shopLaborEstimate: { approxRange: string; basis: string } | null;
}
interface Forecast {
  method: string;
  months: {
    month: string;
    jetAGallons: number;
    avgasGallons: number;
    fuelRevenue: number;
    confidence: "low" | "medium" | "high";
    reasoning: string;
  }[];
  priceGuidance: string;
  risks: string[];
}
interface Scoring {
  month: string;
  actualAvailable: boolean;
  forecastJetAGallons?: number;
  actualJetAGallons?: number;
  errorPct?: number | null;
}

const SEV_COLOR = {
  high: "var(--color-danger)",
  medium: "var(--color-accent)",
  low: "var(--color-text-muted)",
} as const;

export default function InsightsClient({ aiEnabled }: { aiEnabled: boolean }) {
  const insights = useAiCall<{ mode: "demo" | "live"; insights: Insights }>("/api/ai/insights");
  const forecast = useAiCall<{ mode: "demo" | "live"; forecast: Forecast; scoring: Scoring[] | null }>(
    "/api/ai/forecast"
  );
  const [score, setScore] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askMode, setAskMode] = useState<"demo" | "live" | null>(null);

  async function submitQuestion(text: string, presetId?: string) {
    if (!text.trim()) return;
    setQuestion(text);
    setAsking(true);
    setAnswer("");
    setAskError(null);
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, presetId }),
      });
      setAskMode(res.headers.get("X-AI-Mode") === "demo" ? "demo" : "live");
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setAskError(j.reason ?? j.error ?? `Request failed (${res.status})`);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setAnswer((a) => a + dec.decode(value, { stream: true }));
      }
    } catch (err) {
      setAskError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setAsking(false);
    }
  }

  function ask(e: React.FormEvent) {
    e.preventDefault();
    void submitQuestion(question);
  }

  return (
    <div className="space-y-8 p-8">
      {aiEnabled ? (
        <Flag>
          AI output is generated from the operating data and can be wrong. Every figure in this demo
          is itself generated &mdash; nothing here is a real operator&apos;s trading history.
        </Flag>
      ) : (
        <div className="hq-card p-5">
          <p className="text-sm font-medium">Running in sample mode</p>
          <p className="mt-1.5 text-sm text-[color:var(--color-text-muted)]">
            These panels return pre-written sample responses instead of calling a model. The
            figures they quote are real arithmetic over the generated dataset, but the wording is
            scripted &mdash; the &ldquo;Sample response&rdquo; tag marks anything that did not come
            from a model. Set <span className="font-mono text-xs">AI_MODE=live</span> with a funded{" "}
            <span className="font-mono text-xs">ANTHROPIC_API_KEY</span> for live analysis and
            free-form questions.
          </p>
        </div>
      )}

      {/* ---- Insights ---- */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="font-semibold">Business insights</h2>
          <AiBadge mode={insights.data?.mode ?? (aiEnabled ? null : "demo")} />
          <button onClick={() => insights.run()} disabled={insights.loading} className="hq-btn ml-auto">
            {insights.loading ? "Analyzing…" : insights.data ? "Re-analyze" : "Analyze"}
          </button>
        </div>

        {insights.loading && (
          <div className="hq-card px-5 py-2">
            <PlaneProgress durationMs={5400} label="Reviewing 13 months…" />
          </div>
        )}
        {insights.error && <Flag>{insights.error}</Flag>}

        {insights.data && (
          <div className="space-y-4">
            <div className="hq-card p-5">
              <p className="text-sm leading-relaxed">{insights.data.insights.summary}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="hq-card p-5">
                <h3 className="hq-eyebrow mb-2" style={{ color: "var(--color-success)" }}>
                  Earning the most
                </h3>
                <p className="font-mono text-lg">{insights.data.insights.mostProfitable.service}</p>
                {insights.data.insights.mostProfitable.truck && (
                  <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    Best truck: {insights.data.insights.mostProfitable.truck}
                  </p>
                )}
                <p className="mt-2 text-sm">{insights.data.insights.mostProfitable.why}</p>
              </div>
              <div className="hq-card p-5">
                <h3 className="hq-eyebrow mb-2" style={{ color: "var(--color-danger)" }}>
                  Earning the least
                </h3>
                <p className="font-mono text-lg">{insights.data.insights.leastProfitable.service}</p>
                {insights.data.insights.leastProfitable.truck && (
                  <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    Weakest truck: {insights.data.insights.leastProfitable.truck}
                  </p>
                )}
                <p className="mt-2 text-sm">{insights.data.insights.leastProfitable.why}</p>
                {insights.data.insights.shopLaborEstimate && (
                  <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                    Rough shop labour estimate: {insights.data.insights.shopLaborEstimate.approxRange}{" "}
                    <span className="italic">({insights.data.insights.shopLaborEstimate.basis})</span>
                  </p>
                )}
              </div>
            </div>

            <div className="hq-card p-5">
              <h3 className="hq-eyebrow mb-3">Anomalies</h3>
              {insights.data.insights.anomalies.length === 0 ? (
                <p className="text-sm text-[color:var(--color-text-muted)]">
                  Nothing unusual stood out in the visible data.
                </p>
              ) : (
                <ul className="space-y-3">
                  {insights.data.insights.anomalies.map((a, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: SEV_COLOR[a.severity] }}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {a.title}{" "}
                          <span className="font-mono text-xs text-[color:var(--color-text-muted)]">
                            {a.month}
                          </span>
                        </p>
                        <p className="text-sm text-[color:var(--color-text-muted)]">{a.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {insights.data.insights.watchList.length > 0 && (
              <div className="hq-card p-5">
                <h3 className="hq-eyebrow mb-2">Worth watching</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {insights.data.insights.watchList.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ---- Forecast ---- */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="font-semibold">Demand &amp; price forecast</h2>
          <AiBadge mode={forecast.data?.mode ?? (aiEnabled ? null : "demo")} />
          <label className="ml-auto flex items-center gap-2 text-xs text-[color:var(--color-text-muted)]">
            <input type="checkbox" checked={score} onChange={(e) => setScore(e.target.checked)} />
            Score against held-out actuals
          </label>
          <button
            onClick={() => forecast.run({ horizon: 3, score })}
            disabled={forecast.loading}
            className="hq-btn"
          >
            {forecast.loading ? "Projecting…" : forecast.data ? "Re-forecast" : "Forecast 3 months"}
          </button>
        </div>

        {forecast.loading && (
          <div className="hq-card px-5 py-2">
            <PlaneProgress durationMs={4400} label="Projecting 3 months…" />
          </div>
        )}
        {forecast.error && <Flag>{forecast.error}</Flag>}

        {forecast.data && (
          <div className="space-y-4">
            <p className="text-sm text-[color:var(--color-text-muted)]">
              {forecast.data.forecast.method}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {forecast.data.forecast.months.map((m) => (
                <div key={m.month} className="hq-tile">
                  <p className="hq-tile-label">{m.month}</p>
                  <p className="hq-tile-value">{m.jetAGallons.toLocaleString()} gal</p>
                  <p className="hq-tile-sub">
                    Jet A · ${m.fuelRevenue.toLocaleString()} · {m.confidence} confidence
                  </p>
                  <p className="hq-tile-sub mt-1">{m.reasoning}</p>
                </div>
              ))}
            </div>

            <div className="hq-card p-5">
              <h3 className="hq-eyebrow mb-2">Pricing guidance</h3>
              <p className="text-sm">{forecast.data.forecast.priceGuidance}</p>
            </div>

            {forecast.data.forecast.risks.length > 0 && (
              <div className="hq-card p-5">
                <h3 className="hq-eyebrow mb-2">What would break this</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {forecast.data.forecast.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {forecast.data.scoring && (
              <div className="hq-card p-5">
                <h3 className="hq-eyebrow mb-1">Accuracy vs. held-out actuals</h3>
                <p className="mb-3 text-xs text-[color:var(--color-text-muted)]">
                  These months are generated but were never shown to the model, so this is a genuine
                  out-of-sample check rather than a restatement.
                </p>
                <table className="hq-table w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left">Month</th>
                      <th className="text-right">Forecast</th>
                      <th className="text-right">Actual</th>
                      <th className="text-right">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.data.scoring.map((s) => (
                      <tr key={s.month}>
                        <td>{s.month}</td>
                        <td className="text-right">{s.forecastJetAGallons?.toLocaleString() ?? "—"}</td>
                        <td className="text-right">{s.actualJetAGallons?.toLocaleString() ?? "—"}</td>
                        <td
                          className="text-right"
                          style={{
                            color:
                              s.errorPct != null && Math.abs(s.errorPct) > 20
                                ? "var(--color-danger)"
                                : undefined,
                          }}
                        >
                          {s.errorPct == null ? "—" : `${s.errorPct > 0 ? "+" : ""}${s.errorPct}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ---- Ask ---- */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="font-semibold">Ask the data</h2>
          <AiBadge mode={askMode ?? (aiEnabled ? null : "demo")} />
        </div>
        <p className="mb-2.5 text-xs text-[color:var(--color-text-muted)]">
          {aiEnabled ? "Pick one, or type your own." : "Pick a question — free-form asking needs an API key."}
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={asking}
              onClick={() => void submitQuestion(p.question, p.id)}
              className="rounded-full border border-[color:var(--color-border)] px-3.5 py-1.5 text-xs transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={ask} className="flex flex-wrap gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              aiEnabled ? "Ask anything about the operating data…" : "Add an API key to ask your own"
            }
            maxLength={500}
            className="input flex-1"
            style={{ minWidth: 280 }}
          />
          <button type="submit" disabled={asking || !question.trim()} className="hq-btn">
            {asking ? "Thinking…" : "Ask"}
          </button>
        </form>

        {askError && (
          <div className="mt-3">
            <Flag>{askError}</Flag>
          </div>
        )}
        {asking && (
          <div className="hq-card mt-3 px-5 py-2">
            <PlaneProgress durationMs={3000} label="Checking the figures…" />
          </div>
        )}
        {answer && !asking && (
          <div className="hq-card mt-3 whitespace-pre-wrap p-5 text-sm leading-relaxed">{answer}</div>
        )}
      </section>
    </div>
  );
}

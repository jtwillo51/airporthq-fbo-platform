"use client";

import { useState } from "react";
import { Space_Grotesk } from "next/font/google";
import type { FuelPrices, SiteContent } from "@/lib/data";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"] });

// Colors pulled directly from the public site's "Modern" theme
// (public-site/src/app/globals.css) so this preview is
// visually the real thing, not an approximation.
const SV = {
  primary: "#7A2333",
  accent: "#D9AA3E",
  ink: "#16181D",
  muted: "#7A8089",
  line: "rgba(22,24,29,0.08)",
  navBg: "rgba(20,24,31,0.7)",
  darkPanel: "#14181F",
  success: "#2E8B57",
  heroBg:
    "radial-gradient(circle at 20% 20%, rgba(122,35,51,0.55), transparent 55%), radial-gradient(circle at 80% 0%, rgba(217,170,62,0.25), transparent 45%), linear-gradient(160deg,#1B2230 0%, #0F1319 65%)",
};

function EditableText({
  value,
  onChange,
  as = "input",
  style,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  as?: "input" | "textarea";
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  const shared: React.CSSProperties = {
    background: "transparent",
    border: "none",
    borderBottom: "1px dashed rgba(255,255,255,0.25)",
    color: "inherit",
    font: "inherit",
    width: "100%",
    padding: "2px 0",
    ...style,
  };
  return as === "textarea" ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      style={{ ...shared, resize: "vertical" }}
    />
  ) : (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={shared} />
  );
}

function fmtTime(t: string | null): string {
  if (!t) return "";
  const [hh, mm] = t.split(":").map(Number);
  const period = hh >= 12 ? "pm" : "am";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return mm ? `${h12}:${String(mm).padStart(2, "0")}${period}` : `${h12}${period}`;
}

export default function PublicSitePreview({
  initialSite,
  initialPrices,
}: {
  initialSite: SiteContent;
  initialPrices: FuelPrices;
}) {
  const [site, setSite] = useState(initialSite);
  const [prices, setPrices] = useState(initialPrices);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const weekday = site.operatingHours.find((d) => d.day === "Monday");
  const saturday = site.operatingHours.find((d) => d.day === "Saturday");

  function setDay(day: string, field: "open" | "close", value: string) {
    setSite((s) => ({
      ...s,
      operatingHours: s.operatingHours.map((d) =>
        d.day === day || (day === "Weekday" && ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(d.day))
          ? { ...d, [field]: value }
          : d
      ),
    }));
  }

  function setService(i: number, patch: Partial<SiteContent["services"][number]>) {
    setSite((s) => ({
      ...s,
      services: s.services.map((sv, idx) => (idx === i ? { ...sv, ...patch } : sv)),
    }));
  }

  async function save() {
    setPending(true);
    setStatus(null);
    await Promise.all([
      fetch("/api/fuel-prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prices),
      }),
      fetch("/api/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(site),
      }),
    ]);
    setPending(false);
    setStatus("Saved — the public site now reflects these changes.");
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[color:var(--color-text-muted)]">
          This mirrors the public homepage&apos;s actual layout — edit text directly where it
          appears below, then save.
        </p>
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={pending} className="hq-btn">
            {pending ? "Saving…" : "Save changes"}
          </button>
          {status && <span className="text-sm text-[color:var(--color-success)]">{status}</span>}
        </div>
      </div>

      {/* Fake browser chrome so this reads as "a preview of another site", not AirportHQ's own UI */}
      <div className="overflow-hidden rounded-[12px] border border-[color:var(--color-border)]" style={{ boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}>
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#e7e7ea" }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ec6a5e" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f4bf4f" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#61c454" }} />
          <span className="ml-3 rounded-full bg-white px-3 py-0.5 text-[11px] text-[#5a5a5f]">
            ridgeline-aviation.example
          </span>
        </div>

        <div className={spaceGrotesk.className}>
          {/* Nav */}
          <div style={{ background: SV.navBg, backdropFilter: "blur(20px)" }} className="flex items-center gap-3 px-6 py-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ border: `2px solid ${SV.accent}`, color: SV.accent }}
            >
              SV
            </span>
            <div style={{ color: "white" }}>
              <div className="text-[9px] uppercase tracking-[0.14em] opacity-70">Summit Jet Center</div>
              <EditableText
                value={site.facilityName.replace(" / Summit Jet Center", "")}
                onChange={(v) => setSite({ ...site, facilityName: `${v} / Summit Jet Center` })}
                style={{ fontSize: 14, fontWeight: 700 }}
              />
            </div>
            <div className="ml-auto flex gap-4 text-[10px] uppercase tracking-wide text-white/60">
              <span>Home</span>
              <span>Fueling</span>
              <span>Airport Info</span>
              <span>Contact</span>
            </div>
          </div>

          {/* Quick-reference strip */}
          <div style={{ background: SV.darkPanel, borderBottom: "1px solid rgba(255,255,255,0.08)", color: "white" }} className="flex flex-wrap gap-6 px-6 py-3 text-[11px]">
            <span>
              <span style={{ color: "#7A8089" }}>Hours </span>
              Mon–Fri <EditableText value={weekday?.open ?? ""} onChange={(v) => setDay("Weekday", "open", v)} style={{ width: 46, display: "inline-block" }} placeholder="08:00" />
              –<EditableText value={weekday?.close ?? ""} onChange={(v) => setDay("Weekday", "close", v)} style={{ width: 46, display: "inline-block" }} placeholder="17:00" />
              {" · Sat "}
              <EditableText value={saturday?.open ?? ""} onChange={(v) => setDay("Saturday", "open", v)} style={{ width: 46, display: "inline-block" }} placeholder="08:00" />
              –<EditableText value={saturday?.close ?? ""} onChange={(v) => setDay("Saturday", "close", v)} style={{ width: 46, display: "inline-block" }} placeholder="12:00" />
              {weekday?.open && (
                <span style={{ color: SV.accent, marginLeft: 6 }}>
                  ({fmtTime(weekday.open)}–{fmtTime(weekday.close)}
                  {saturday?.open ? ` · Sat ${fmtTime(saturday.open)}–${fmtTime(saturday.close)}` : ""})
                </span>
              )}
            </span>
            <span>
              <span style={{ color: "#7A8089" }}>After-Hours </span>
              <span style={{ color: SV.accent }}>
                Call-out, $<EditableText value={String(site.afterHoursFee)} onChange={(v) => setSite({ ...site, afterHoursFee: Number(v) || 0 })} style={{ width: 40, display: "inline-block", color: SV.accent }} /> fee
              </span>
            </span>
            <span>
              <span style={{ color: "#7A8089" }}>Phone </span>
              <EditableText value={site.phone} onChange={(v) => setSite({ ...site, phone: v })} style={{ width: 120, display: "inline-block" }} />
            </span>
            <span>
              <span style={{ color: "#7A8089" }}>100LL </span>
              <span style={{ color: SV.accent }}>${prices.avgas100LL.price.toFixed(2)}</span>
            </span>
            <span>
              <span style={{ color: "#7A8089" }}>Jet A </span>
              <span style={{ color: SV.accent }}>${prices.jetAFullServe.price.toFixed(2)}</span>
            </span>
          </div>

          {/* Hero */}
          <div style={{ background: SV.heroBg }} className="grid gap-8 px-6 py-10 lg:grid-cols-[1.3fr_0.9fr]">
            <div style={{ color: "white" }}>
              <EditableText
                as="textarea"
                value={site.heroHeadline}
                onChange={(v) => setSite({ ...site, heroHeadline: v })}
                style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}
              />
              <div style={{ marginTop: 14, maxWidth: 420, color: "rgba(255,255,255,0.85)", fontFamily: "Inter, sans-serif" }}>
                <EditableText as="textarea" value={site.heroSubheadline} onChange={(v) => setSite({ ...site, heroSubheadline: v })} style={{ fontSize: 13 }} />
              </div>
              <div className="mt-6 flex gap-3">
                <span className="rounded-full px-4 py-2 text-xs font-semibold" style={{ background: SV.accent, color: "#4A1520" }}>
                  View Fuel Prices
                </span>
                <span className="rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ background: "rgba(120,120,120,0.15)" }}>
                  Request Fuel
                </span>
              </div>
            </div>

            <div
              className="rounded-[16px] p-5"
              style={{
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "white",
              }}
            >
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.6)" }}>
                Current Fuel Prices
              </div>
              <PriceRow label="100LL Self-Serve" value={prices.avgas100LL.price} onChange={(v) => setPrices({ ...prices, avgas100LL: { price: v, isPlaceholder: false } })} />
              <PriceRow label="Jet A Full-Serve" value={prices.jetAFullServe.price} onChange={(v) => setPrices({ ...prices, jetAFullServe: { price: v, isPlaceholder: false } })} />
              <PriceRow label="Jet A Self-Serve" value={prices.jetASelfServe.price} onChange={(v) => setPrices({ ...prices, jetASelfServe: { price: v, isPlaceholder: false } })} last />
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: SV.success }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: SV.success }} />
                Updated {prices.updatedAt} &middot; via AirportHQ
              </div>
            </div>
          </div>

          {/* Services grid */}
          <div style={{ background: "#FAF9F7" }} className="px-6 py-9">
            <div style={{ color: SV.ink, fontSize: 20, fontWeight: 700 }}>Everything the ramp needs, handled.</div>
            <div style={{ color: SV.muted, fontSize: 12, marginTop: 4, fontFamily: "Inter, sans-serif" }}>
              {site.services.length} services, one crew.
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {site.services.map((s, i) => (
                <div key={i} className="rounded-[14px] border bg-white p-4" style={{ borderColor: SV.line }}>
                  <EditableText
                    value={s.icon}
                    onChange={(v) => setService(i, { icon: v })}
                    style={{ fontSize: 20, borderBottom: "none", width: 28 }}
                  />
                  <div style={{ marginTop: 8, fontWeight: 600, fontSize: 12.5, color: SV.ink }}>
                    <EditableText value={s.name} onChange={(v) => setService(i, { name: v })} style={{ borderBottomColor: SV.line, color: SV.ink }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: "#0D0F13", color: "rgba(255,255,255,0.5)" }} className="flex justify-between px-6 py-4 text-[11px]">
            <span>{site.facilityName} &middot; Ridgeline Regional ({site.airportCode})</span>
            <span style={{ color: "white" }}>{site.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-baseline justify-between py-2"
      style={{ borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.18)" }}
    >
      <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", fontFamily: "Inter, sans-serif" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 2, fontWeight: 700, fontSize: 17 }}>
        $
        <EditableText
          value={value.toFixed(2)}
          onChange={(v) => onChange(Number(v) || 0)}
          style={{ width: 52, textAlign: "right" }}
        />
      </span>
    </div>
  );
}

import { getFuelPrices, getSiteContent } from "@/lib/data";

export const metadata = { title: "Fuel & FBO Services | Ridgeline Aviation" };

function updatedLabel(updatedAt: string): string {
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return `Updated ${days} days ago`;
}

function PriceCard({ label, price }: { label: string; price: number }) {
  return (
    <div className="rounded-[20px] border bg-white p-6" style={{ borderColor: "var(--color-line)" }}>
      <div
        className="mb-2 text-xs font-semibold uppercase tracking-[0.06em]"
        style={{ color: "var(--color-muted)" }}
      >
        {label}
      </div>
      <div className="numeral text-[28px] font-bold">${price.toFixed(2)}</div>
    </div>
  );
}

function fmt(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  const period = hh >= 12 ? "pm" : "am";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return mm ? `${h12}:${String(mm).padStart(2, "0")}${period}` : `${h12}${period}`;
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex justify-between py-2.5 text-[13.5px]"
      style={{ borderBottom: last ? "none" : "1px solid var(--color-line)" }}
    >
      <span style={{ color: "var(--color-muted)" }}>{label}</span>
      <span className="numeral">{value}</span>
    </div>
  );
}

export default async function FuelingPage() {
  const [prices, site] = await Promise.all([getFuelPrices(), getSiteContent()]);
  const weekday = site.operatingHours.find((d) => d.day === "Monday");
  const saturday = site.operatingHours.find((d) => d.day === "Saturday");

  return (
    <div className="px-6 py-[70px]">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="font-display text-[32px] font-bold">Fuel &amp; FBO Services</h1>
        <p className="mt-2.5 max-w-[500px] text-[15px]" style={{ color: "var(--color-muted)" }}>
          Self-serve and full-serve, 100LL and Jet A. After-hours call-out: $
          {site.afterHoursFee.toFixed(0)}.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <PriceCard label="100LL Self-Serve" price={prices.avgas100LL.price} />
          <PriceCard label="Jet A Full-Serve" price={prices.jetAFullServe.price} />
          <PriceCard label="Jet A Self-Serve" price={prices.jetASelfServe.price} />
        </div>

        <div className="mt-6 rounded-[20px] border bg-white p-6" style={{ borderColor: "var(--color-line)" }}>
          <h2 className="mb-3 font-display text-[17px] font-semibold">Planning notes</h2>
          <Row label="Self-serve availability" value="24/7, card reader on pump" />
          <Row
            label="Full-serve / line service"
            value={
              weekday?.open && weekday.close && saturday?.open && saturday.close
                ? `Mon–Fri ${fmt(weekday.open)}–${fmt(weekday.close)}, Sat ${fmt(saturday.open)}–${fmt(saturday.close)}`
                : "See hours"
            }
          />
          <Row
            label="After-hours call-out"
            value={`$${site.afterHoursFee.toFixed(0)} fee — call ${site.phone}`}
          />
          <Row
            label="Fuel truck (ramp delivery)"
            value="Available during staffed hours"
            last
          />
        </div>

        <div
          className="mt-6 flex flex-wrap items-center gap-2.5 rounded-[20px] border bg-white p-6"
          style={{ borderColor: "var(--color-line)" }}
        >
          <span className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--color-success)" }}>
            <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: "var(--color-success)" }} />
            {updatedLabel(prices.updatedAt)} &middot; via AirportHQ
          </span>
          <span className="text-xs" style={{ color: "var(--color-muted)" }}>
            &mdash; published from Ridgeline&apos;s management dashboard, never edited here directly.
          </span>
        </div>
      </div>
    </div>
  );
}

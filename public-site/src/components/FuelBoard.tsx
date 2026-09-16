import type { FuelPrices } from "@/lib/data";

function updatedLabel(updatedAt: string): string {
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return `Updated ${days} days ago`;
}

export default function FuelBoard({ prices, title = "Current Fuel Prices" }: { prices: FuelPrices; title?: string }) {
  return (
    <div className="glass-card p-6" style={{ boxShadow: "0 25px 55px rgba(0,0,0,0.25)" }}>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.6)" }}>
        {title}
      </h3>
      <Row label="100LL Self-Serve" price={prices.avgas100LL.price} last={false} />
      <Row label="Jet A Full-Serve" price={prices.jetAFullServe.price} last={false} />
      <Row label="Jet A Self-Serve" price={prices.jetASelfServe.price} last />
      <div className="mt-4 flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--color-success)" }}>
        <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: "var(--color-success)" }} />
        {updatedLabel(prices.updatedAt)} &middot; via AirportHQ
      </div>
    </div>
  );
}

function Row({ label, price, last }: { label: string; price: number; last: boolean }) {
  return (
    <div
      className="flex items-baseline justify-between py-2.5"
      style={{ borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.18)" }}
    >
      <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.65)" }}>
        {label}
      </span>
      <span className="numeral text-[21px] font-bold text-white">${price.toFixed(2)}</span>
    </div>
  );
}

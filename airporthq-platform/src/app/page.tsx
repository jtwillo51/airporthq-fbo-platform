import PageHeader from "@/components/PageHeader";
import { getCashBox, getFuelTankLog } from "@/lib/data";
import { getProfitRollup } from "@/lib/reports";
import Link from "next/link";

export default async function DashboardPage() {
  const [cashBox, tanks, rollup] = await Promise.all([
    getCashBox(),
    getFuelTankLog(),
    getProfitRollup(),
  ]);

  const cashTotal = cashBox.entries.at(-1)?.runningTotal ?? 0;
  const last100LL = tanks["100LL"].at(-1);
  const lastJetA = tanks.jetA.at(-1);
  const monthGallons100LL = tanks["100LL"].reduce((s, d) => s + (d.gallonsPumped ?? 0), 0);
  const monthGallonsJetA = tanks.jetA.reduce((s, d) => s + (d.gallonsPumped ?? 0), 0);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="July 2026 · Ridgeline Aviation" />
      <div className="p-8">
        <p className="hq-eyebrow mb-3">Live readouts</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Cash box" value={`$${cashTotal.toFixed(2)}`} live />
          <Tile
            label="100LL tank"
            value={`${last100LL?.endStickGal?.toLocaleString() ?? "—"} gal`}
            sub={last100LL?.date}
            live
          />
          <Tile
            label="Jet A tank"
            value={`${lastJetA?.endStickGal?.toLocaleString() ?? "—"} gal`}
            sub={lastJetA?.date}
            live
          />
          <Tile
            label="Month-to-date pumped"
            value={`${(monthGallons100LL + monthGallonsJetA).toLocaleString()} gal`}
            sub={`${monthGallons100LL.toLocaleString()} 100LL · ${monthGallonsJetA.toLocaleString()} Jet A`}
          />
        </div>

        <p className="hq-eyebrow mb-3 mt-9">This month</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Tile label="Derived fuel revenue" value={`$${rollup.fuel.matchedRevenue.toLocaleString()}`} />
          <Tile label="Landing fees (FBO 80%)" value={`$${rollup.landingFees.fboShare.toLocaleString()}`} />
          <Tile
            label="Net profit estimate"
            value={`$${rollup.netEstimate.toLocaleString()}`}
            accent
          />
        </div>

        <div className="mt-9 flex flex-wrap gap-2.5">
          <Link href="/fuel" className="hq-btn">
            Log today&apos;s fuel
          </Link>
          <Link href="/cash-box" className="hq-btn hq-btn--ghost">
            Add cash box entry
          </Link>
          <Link href="/site-content" className="hq-btn hq-btn--ghost">
            Update public site
          </Link>
          <Link href="/reports" className="hq-btn hq-btn--ghost">
            View reports
          </Link>
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  accent,
  live,
}: {
  label: string;
  value: string;
  sub?: string | null;
  accent?: boolean;
  live?: boolean;
}) {
  return (
    <div className={`hq-tile ${accent ? "hq-tile--accent" : ""}`}>
      <p className="hq-tile-label">
        {live && <span className="hq-dot hq-dot--amber" aria-hidden="true" />}
        {label}
      </p>
      <p className="hq-tile-value">{value}</p>
      {sub && <p className="hq-tile-sub">{sub}</p>}
    </div>
  );
}

import { getVisibleTimeline, type TimelineMonth } from "@/lib/timeline";

const r2 = (n: number) => Math.round(n * 100) / 100;

export interface ProfitLine {
  key: string;
  label: string;
  revenue: number;
  cost: number;
  margin: number;
  marginPct: number | null;
  /** Volume in the line's natural unit (gallons, nights, movements). */
  units: number;
  unitLabel: string;
  /** Set when the figure rests on an assumption the client has not confirmed. */
  caveat?: string;
}

export interface ProfitabilityReport {
  months: string[];
  trucks: ProfitLine[];
  services: ProfitLine[];
  best: { trucks: ProfitLine | null; services: ProfitLine | null };
  worst: { trucks: ProfitLine | null; services: ProfitLine | null };
  caveats: string[];
  containsSynthetic: boolean;
  containsReal: boolean;
}

function selectMonths(all: TimelineMonth[], month?: string, allHistory?: boolean) {
  if (allHistory || !month) return all;
  return all.filter((m) => m.month === month);
}

/**
 * Margin by fuel truck and by service line.
 *
 * Fuel margin is (retail - wholesale cost) x gallons. Wholesale cost is not
 * recorded anywhere in the client's workbook - it is present only in the
 * synthetic timeline and interpolated for the one real month - so every fuel
 * margin figure is an estimate and is labelled as such.
 *
 * Non-fuel lines carry no direct cost in the source data, so their "margin"
 * is revenue net of the shares that go to third parties (airport authority,
 * hangar owner), not a true contribution margin.
 */
export async function getProfitability(
  opts: { month?: string; allHistory?: boolean } = {}
): Promise<ProfitabilityReport> {
  const all = await getVisibleTimeline();
  const months = selectMonths(all, opts.month, opts.allHistory);

  const truckAgg = new Map<string, { rev: number; cost: number; gal: number; fuel: Set<string> }>();
  let jetGal = 0, jetRev = 0, jetCost = 0;
  let avGal = 0, avRev = 0, avCost = 0;
  let landingGross = 0, landingAirportShare = 0, landingFboShare = 0;
  let hangarNet = 0, hangarOwner = 0;
  let shopSpend = 0;

  for (const m of months) {
    for (const t of m.truckTransactions) {
      const isJet = t.fuelType === "Jet A";
      const retail = isJet ? m.retail.jetAPerGal : m.retail.avgasPerGal;
      const cost = isJet ? m.costs.jetAPerGal : m.costs.avgasPerGal;
      const rev = retail * t.gallons;
      const cst = cost * t.gallons;

      const key = t.truck || "Unassigned";
      const cur = truckAgg.get(key) ?? { rev: 0, cost: 0, gal: 0, fuel: new Set<string>() };
      cur.rev += rev;
      cur.cost += cst;
      cur.gal += t.gallons;
      cur.fuel.add(t.fuelType);
      truckAgg.set(key, cur);

      if (isJet) { jetGal += t.gallons; jetRev += rev; jetCost += cst; }
      else { avGal += t.gallons; avRev += rev; avCost += cst; }
    }

    for (const l of m.landingFees) {
      landingGross += l.total ?? 0;
      landingAirportShare += l.airportShare ?? 0; // 20% to the airport authority
      landingFboShare += l.fboShare ?? 0;         // 80% retained by the FBO
    }
    for (const h of m.hangarSettlements) {
      hangarNet += h.netRent ?? 0;
      hangarOwner += h.ownerShareAmount ?? 0;
    }
    for (const s of m.shopTransactions) shopSpend += s.amount ?? 0;
  }

  const line = (
    key: string, label: string, revenue: number, cost: number,
    units: number, unitLabel: string, caveat?: string
  ): ProfitLine => {
    const margin = r2(revenue - cost);
    return {
      key, label,
      revenue: r2(revenue), cost: r2(cost), margin,
      marginPct: revenue > 0 ? r2((margin / revenue) * 100) : null,
      units: r2(units), unitLabel, caveat,
    };
  };

  const trucks: ProfitLine[] = [...truckAgg.entries()]
    .map(([name, v]) =>
      line(name, `${name} (${[...v.fuel].join(" + ")})`, v.rev, v.cost, v.gal, "gal",
        "Margin is posted retail less modelled wholesale cost.")
    )
    .sort((a, b) => b.margin - a.margin);

  const services: ProfitLine[] = [
    line("jetA", "Jet A fuel", jetRev, jetCost, jetGal, "gal"),
    line("avgas", "100LL fuel", avRev, avCost, avGal, "gal"),
    line("landing", "Landing / ramp fees", landingGross, landingGross - landingFboShare,
      months.reduce((s, m) => s + m.landingFees.length, 0), "movements",
      "Margin is the FBO's 80% share after 5% sales tax and 3.5% card fees; the remaining 20% goes to the airport authority."),
    line("hangar", "Hangar rental", hangarNet, hangarOwner,
      months.reduce((s, m) => s + m.hangarSettlements.length, 0), "stays",
      "Net of the third-party hangar owner's 70% share of net rent."),
    line("shop", "Maintenance shop", 0, shopSpend,
      months.reduce((s, m) => s + m.shopTransactions.length, 0), "purchases",
      "Cost-only: parts spend is modelled but labour billing is not, so this line always reads as a loss."),
  ].sort((a, b) => b.margin - a.margin);

  const containsSynthetic = months.some((m) => m.synthetic);
  const containsReal = months.some((m) => !m.synthetic);

  const caveats = [
    "All figures are generated demo data - this is a portfolio piece, not a real operator's trading history.",
    "The maintenance shop shows as cost-only because parts spend is modelled but labour billing is not. It is a gap in the data model, not a loss-making line.",
  ];

  return {
    months: months.map((m) => m.month),
    trucks, services,
    best: { trucks: trucks[0] ?? null, services: services[0] ?? null },
    worst: {
      trucks: trucks.length ? trucks[trucks.length - 1] : null,
      services: services.length ? services[services.length - 1] : null,
    },
    caveats, containsSynthetic, containsReal,
  };
}

/**
 * Canned analysis for demo mode.
 *
 * These are NOT model output. They are hand-written responses used when no
 * ANTHROPIC_API_KEY is configured, so the portfolio piece is fully explorable
 * without a key or a bill. Every route tags its payload with
 * `mode: "demo" | "live"` and the UI labels demo output as scripted rather
 * than AI-generated - mock text must never be passed off as a real answer.
 *
 * The figures below were computed from the generated dataset, so the narrative
 * agrees with what the tables on screen actually show. If the timeline
 * generator's seed or rules change, re-derive them.
 */

export interface MockInsights {
  summary: string;
  anomalies: { title: string; detail: string; severity: "low" | "medium" | "high"; month: string }[];
  mostProfitable: { service: string; why: string; truck: string | null };
  leastProfitable: { service: string; why: string; truck: string | null };
  watchList: string[];
  shopLaborEstimate: { approxRange: string; basis: string } | null;
}

export const MOCK_INSIGHTS: MockInsights = {
  summary:
    "Across the 13 months on the books, Jet A is carrying the business: $399,015 of margin on 160,851 gallons, about $2.48 a gallon. Everything else combined adds roughly $93,000. Three months break the pattern and each has a clear cause — an engine overhaul in November, a wholesale price spike in January, and unexplained Jet A tank losses in March. August is still in progress, so its totals are short by design.",
  anomalies: [
    {
      title: "Jet A tank losses breached the leak-check threshold",
      detail:
        "Cumulative over/short finished the month at −680 gallons against a threshold of 267 gallons (13,718 × 0.01 + 130). That is roughly 2.5× the allowance and the single clearest operational signal in the data. Worth checking the tank, the lines, and meter calibration before assuming it is measurement drift.",
      severity: "high",
      month: "2026-03",
    },
    {
      title: "Fuel margin collapsed to $1.46 a gallon",
      detail:
        "Wholesale Jet A jumped to $4.74 from about $3.85 the month before, but posted retail moved down to $6.20. Margin fell from roughly $2.60 to $1.46 a gallon — a 44% cut — on 9,079 gallons. The cost moved and the price at the pump did not follow.",
      severity: "high",
      month: "2026-01",
    },
    {
      title: "Shop parts spend ran 2.5× normal",
      detail:
        "$20,355 against a typical month near $8,000, driven by a single engine overhaul on N858LR. Expected for the work involved, but it will distort any month-over-month comparison that includes November.",
      severity: "medium",
      month: "2025-11",
    },
    {
      title: "February was the quietest month on record",
      detail:
        "5,231 gallons of Jet A, about a quarter of July's 21,331. Consistent with a mountain airport in deep winter rather than anything going wrong, but it is the floor to plan cash around.",
      severity: "low",
      month: "2026-02",
    },
  ],
  mostProfitable: {
    service: "Jet A fuel",
    why:
      "$399,015 of margin on 160,851 gallons, around $2.48 a gallon. It is roughly 81% of total margin and it is not close — 100LL is the next largest contributor at $55,902.",
    truck: "Truck #3 (Jet A)",
  },
  leastProfitable: {
    service: "Maintenance shop",
    why:
      "It shows $111,871 of parts spend against zero revenue, but that is a gap in the records, not a failing shop — labour billing is not captured anywhere in the data. Do not read this as a line to cut; the fix is to start recording what the shop bills. Of the lines that are fully measured, hangar rental is the weakest at $8,317 retained, because the hangar owner takes 70% of net rent.",
    truck: null,
  },
  watchList: [
    "March's −680 gallon Jet A discrepancy — confirm whether it was a leak, a meter, or a recording error.",
    "Whether posted retail is tracking wholesale; January shows it can lag badly enough to halve margin.",
    "Hangar economics — the 70% owner share leaves only $8,317 of $27,724 net rent with the FBO.",
    "Capture shop labour billing so the maintenance line can be judged on more than parts cost.",
  ],
  shopLaborEstimate: {
    approxRange: "$60,000–$95,000 over the 13 months — very approximate.",
    basis:
      "Assumes roughly 10–15% of the 6,508 hours logged across the three staff over the period were billable shop repair time (the rest is fueling and line service), at the shop's $95/hour rate-card rate. Excludes diagnostic fees, which aren't itemized separately in the data, so treat this as a floor rather than a full number.",
  },
};

export interface MockForecast {
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

export const MOCK_FORECAST: MockForecast = {
  method:
    "Seasonal baseline: August's partial month is scaled to a full month, then adjusted by the season index each month carries relative to August, and cross-checked against the same months a year earlier.",
  months: [
    {
      month: "2026-09",
      jetAGallons: 15600,
      avgasGallons: 3300,
      fuelRevenue: 124800,
      confidence: "high",
      reasoning:
        "September runs about 20% below an August peak; last September delivered 12,841 gallons off a weaker base.",
    },
    {
      month: "2026-10",
      jetAGallons: 13100,
      avgasGallons: 2600,
      fuelRevenue: 105600,
      confidence: "medium",
      reasoning: "Shoulder season. Last October came in at 13,520 gallons, which anchors this closely.",
    },
    {
      month: "2026-11",
      jetAGallons: 10200,
      avgasGallons: 1900,
      fuelRevenue: 82600,
      confidence: "medium",
      reasoning:
        "First real winter month. Last November's 6,968 gallons is an understated comparison because the overhaul month also ran light on traffic.",
    },
  ],
  priceGuidance:
    "Wholesale has drifted up about $0.26 a gallon since spring while posted retail moved roughly $0.10, so margin has quietly narrowed from $2.58 to $2.47. A $0.10–$0.15 increase on Jet A would restore spring margin and still sit within the range this field has charged all year. The bigger lesson is January: when wholesale jumps, move the posted price in the same week rather than absorbing it.",
  risks: [
    "An early hard winter would pull November well below this line — February's 5,231 gallons shows how far demand can fall.",
    "The March tank discrepancy, if it was a real leak rather than measurement error, means volume sold and volume paid for are not the same number.",
    "These figures assume no change to the transient jet traffic that drives most Jet A uplift; a single based operator leaving would move them materially.",
  ],
};

export interface PresetQuestion {
  id: string;
  question: string;
  answer: string;
}

export const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    id: "weakest-margin",
    question: "Which month had the weakest fuel margin, and why?",
    answer:
      "January 2026, at $1.46 a gallon on Jet A — down from about $2.60 the month either side.\n\nIt was a cost problem, not a demand problem. Wholesale went to $4.74 a gallon from roughly $3.85, a jump of nearly 90 cents, while the posted retail price actually went down slightly to $6.20. Volume was normal for midwinter at 9,079 gallons.\n\nIn short: the cost moved and the pump price did not follow. That single month gave up roughly $10,000 of margin against a typical January.",
  },
  {
    id: "shop-losing-money",
    question: "Is the maintenance shop actually losing money?",
    answer:
      "Almost certainly not — but the data cannot prove it either way.\n\nThe shop shows $111,871 of parts spend across 13 months and zero revenue, which makes it look like the worst line in the business. The catch is that labour billing is not recorded anywhere in the system. Only parts going out are captured; nothing that the shop invoices comes back in.\n\nSo the honest answer is that this line is unmeasurable right now, not unprofitable. Before making any decision about the shop, start capturing what it bills — until then, any comparison against fuel or hangar is meaningless.",
  },
  {
    id: "leak-check",
    question: "Why did the Jet A tank trip the leak check in March?",
    answer:
      "Cumulative over/short closed March at −680 gallons, against an allowed threshold of 267 gallons.\n\nThe threshold is throughput times 1% plus a flat 130-gallon allowance: 13,718 × 0.01 + 130 = 267.18. Being 680 gallons short is about 2.5× that, and the shortfall accumulated steadily through the month rather than appearing on one day — which is more consistent with a slow loss than a single mis-keyed delivery.\n\nAt roughly $6.58 a gallon retail, that is about $4,500 of fuel unaccounted for. Worth checking the tank, the lines, and the meter calibration.",
  },
  {
    id: "price-jet-a",
    question: "What should I charge for Jet A next month?",
    answer:
      "Somewhere around $6.75–$6.80, up about 10 to 15 cents from the current $6.67.\n\nWholesale has climbed roughly $0.26 a gallon since spring while the posted price has only moved about $0.10, so margin has quietly slipped from $2.58 to $2.47 a gallon. A 10–15 cent increase restores spring margin and still sits inside the range this field has posted all year.\n\nOne caveat: this is a margin argument, not a demand study. There is nothing in the data about what nearby fields are charging, and on a route where pilots can tanker fuel, that matters.",
  },
  {
    id: "truck-comparison",
    question: "Which truck earns more, and by how much?",
    answer:
      "Truck #3 by a wide margin, though the two are not really comparable.\n\nTruck #3 runs Jet A: 160,851 gallons for $399,015 of margin, about $2.48 a gallon. Truck #4 runs 100LL: 35,874 gallons for $55,902, about $1.56 a gallon.\n\nSo #3 moves 4.5× the volume at 1.6× the margin per gallon — roughly seven times the total contribution. That is a reflection of the customer mix rather than the equipment: transient jets uplift hundreds of gallons at a time, while piston aircraft take 20 to 110.",
  },
  {
    id: "winter-vs-summer",
    question: "How much does winter actually cost us?",
    answer:
      "Roughly a quarter of peak volume, and it is very predictable.\n\nJuly ran 21,331 gallons of Jet A. February ran 5,231 — about 25% of the peak. The slide is orderly: the season steps down through autumn and back up through spring, with no month breaking the pattern.\n\nIn margin terms a July is worth roughly $52,000 on fuel and a February about $13,000. The practical implication is cash planning rather than pricing: the business needs to carry roughly $40,000 a month of seasonal swing through the winter, and the quiet months are the right window for tank and truck maintenance.",
  },
];

/** Simulated processing time so demo mode feels like real work. */
export const MOCK_LATENCY_MS = {
  insights: 5400,
  forecast: 4400,
  ask: 3000,
} as const;

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

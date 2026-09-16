/**
 * Reference labour rates for maintenance shops.
 *
 * The source data records shop PARTS spend but never labour billing (see the
 * caveat in `profitability.ts` and `ANALYST_SYSTEM`), so the shop always
 * looks cost-only. These rate cards exist to give the AI something concrete
 * to reason with when asked about that gap - a flat diagnostic fee for the
 * initial inspection/troubleshooting, and an hourly rate once a repair is
 * authorized - so it can offer a rough, clearly-labelled order of magnitude
 * instead of only repeating "labour billing isn't captured."
 *
 * These are rate-card figures, not billed amounts. The dataset has no record
 * of actual hours billed, how many jobs were diagnostic-only vs. full
 * repairs, or how shop time splits from the other work the same staff do
 * (line service, fueling, etc.). Any dollar figure derived from these rates
 * is an illustrative estimate, not a derived actual - callers must keep it
 * caveated as such rather than presenting it as a real total.
 *
 * Modelled as a list, keyed by shop, because a multi-location build of this
 * app could carry more than one physical shop. Today the dataset only
 * contains Ridgeline Aviation's single shop at KXRG.
 */
export interface ShopRateCard {
  /** Shop/operator name. */
  shop: string;
  /** Physical location, for when more than one shop exists. */
  location: string;
  /** Flat fee for initial inspection/troubleshooting, before any repair is authorized. */
  diagnosticFeeUsd: number;
  /** Rate charged per hour of labour once a repair is authorized. */
  hourlyRepairRateUsd: number;
  notes?: string;
}

export const SHOP_RATE_CARDS: ShopRateCard[] = [
  {
    shop: "Ridgeline Aviation",
    location: "KXRG - Ridgeline Regional",
    diagnosticFeeUsd: 150,
    hourlyRepairRateUsd: 95,
    notes:
      "The shop this dataset covers. The flat fee covers initial inspection/troubleshooting; the hourly rate applies once a repair is authorized. Neither is recorded as billed revenue anywhere in the source data.",
  },
];

/** Look up a shop's rate card by name; undefined if not modelled. */
export function getShopRateCard(shop: string): ShopRateCard | undefined {
  return SHOP_RATE_CARDS.find((c) => c.shop.toLowerCase() === shop.toLowerCase());
}

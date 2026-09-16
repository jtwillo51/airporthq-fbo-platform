"use client";

import { useMemo } from "react";
import MonthSearchBar from "@/components/MonthSearchBar";
import { filterRows, getMonthsPresent, useFilterState } from "@/lib/useMonthSearch";
import type { CcPurchases } from "@/lib/data";
import { FboTable, ShopTable } from "./PurchaseTables";

const FBO_SEARCH_KEYS = ["business", "description"];
const SHOP_SEARCH_KEYS = ["vendor", "referenceOrStock", "tailNumberOrShop"];

export default function PurchasesClient({ data }: { data: CcPurchases }) {
  const monthsPresent = useMemo(
    () =>
      Array.from(
        new Set([
          ...getMonthsPresent(data.fboCardTransactions, "date"),
          ...getMonthsPresent(data.shopTransactions, "date"),
        ])
      ).sort(),
    [data]
  );
  const { month, setMonth, query, setQuery, allHistory, setAllHistory } = useFilterState(
    monthsPresent.at(-1)
  );

  const fbo = useMemo(
    () => filterRows({ rows: data.fboCardTransactions, dateKey: "date", searchKeys: FBO_SEARCH_KEYS, month, query, allHistory }),
    [data, month, query, allHistory]
  );
  const shop = useMemo(
    () => filterRows({ rows: data.shopTransactions, dateKey: "date", searchKeys: SHOP_SEARCH_KEYS, month, query, allHistory }),
    [data, month, query, allHistory]
  );

  const fboTotal = fbo.reduce((s, t) => s + (t.amount ?? 0), 0);
  const shopTotal = shop.reduce((s, t) => s + (t.amount ?? 0), 0);

  return (
    <>
      <MonthSearchBar
        month={month}
        onMonthChange={setMonth}
        monthsPresent={monthsPresent}
        query={query}
        onQueryChange={setQuery}
        allHistory={allHistory}
        onAllHistoryChange={setAllHistory}
        resultCount={fbo.length + shop.length}
        searchPlaceholder="Search vendor, business, description…"
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-1 font-semibold">FBO Card Transactions</h2>
          <p className="mb-3 text-xs text-[color:var(--color-text-muted)]">Total: ${fboTotal.toFixed(2)}</p>
          <FboTable rows={fbo} />
        </section>
        <section>
          <h2 className="mb-1 font-semibold">Maintenance Shop Transactions</h2>
          <p className="mb-3 text-xs text-[color:var(--color-text-muted)]">Total: ${shopTotal.toFixed(2)}</p>
          <ShopTable rows={shop} />
        </section>
      </div>
    </>
  );
}

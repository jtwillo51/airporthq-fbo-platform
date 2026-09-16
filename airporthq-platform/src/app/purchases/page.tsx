import PageHeader from "@/components/PageHeader";
import { getCcPurchases } from "@/lib/data";
import PurchasesClient from "./PurchasesClient";

export default async function PurchasesPage() {
  const data = await getCcPurchases();

  return (
    <div>
      <PageHeader title="CC Purchases" subtitle="FBO card + maintenance shop transactions" />
      <div className="p-8">
        <PurchasesClient data={data} />
      </div>
    </div>
  );
}

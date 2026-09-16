import PageHeader from "@/components/PageHeader";
import { getLandingFees } from "@/lib/data";
import LandingFeesClient from "./LandingFeesClient";

export default async function LandingFeesPage() {
  const lf = await getLandingFees();

  return (
    <div>
      <PageHeader title="Landing Fees" subtitle={lf._note} />
      <div className="p-8">
        <LandingFeesClient records={lf.records} />
      </div>
    </div>
  );
}

import PageHeader from "@/components/PageHeader";
import { isDemoMode } from "@/lib/ai/client";
import InsightsClient from "./InsightsClient";

export default function InsightsPage() {
  // Only the boolean crosses to the client - never the key itself.
  return (
    <div>
      <PageHeader
        title="AI Insights"
        subtitle="Anomalies, profitability, forecasting, and plain-language answers over the operating data"
      />
      <InsightsClient aiEnabled={!isDemoMode()} />
    </div>
  );
}

import PageHeader from "@/components/PageHeader";
import { getFuelPrices, getSiteContent } from "@/lib/data";
import PublicSitePreview from "./PublicSitePreview";

export default async function SiteContentPage() {
  const [site, prices] = await Promise.all([getSiteContent(), getFuelPrices()]);

  return (
    <div>
      <PageHeader
        title="Public Site Content"
        subtitle="Edits here write to shared-data/ and appear on the public site"
      />
      <div className="p-8">
        <PublicSitePreview initialSite={site} initialPrices={prices} />
      </div>
    </div>
  );
}

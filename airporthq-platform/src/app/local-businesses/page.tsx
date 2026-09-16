import PageHeader from "@/components/PageHeader";
import { getBusinessDirectory } from "@/lib/data";
import BusinessDirectoryEditor from "./BusinessDirectoryEditor";

export default async function LocalBusinessesPage() {
  const directory = await getBusinessDirectory();

  return (
    <div>
      <PageHeader
        title="Local Businesses"
        subtitle="Third-party operators on the field — flight schools, detailers, avionics, mechanics. Shown on the public site's Local Businesses page."
      />
      <div className="p-8">
        <BusinessDirectoryEditor initial={directory} />
      </div>
    </div>
  );
}

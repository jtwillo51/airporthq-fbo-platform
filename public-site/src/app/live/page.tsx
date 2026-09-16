import { getSiteContent } from "@/lib/data";

export const metadata = { title: "Live Tarmac Cam | Ridgeline Aviation" };

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const id = u.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export default async function LivePage() {
  const site = await getSiteContent();
  const embed = toEmbedUrl(site.livestreamUrl);

  return (
    <div className="px-6 py-[70px]">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="font-display text-[32px] font-bold">Live Tarmac Cam</h1>
        <p className="mt-2.5 max-w-[500px] text-[15px]" style={{ color: "var(--color-muted)" }}>
          See current ramp activity at {site.airportCode} before you call.
        </p>

        <div className="dark-card mt-8 aspect-video overflow-hidden">
          {embed ? (
            <iframe
              className="h-full w-full"
              src={embed}
              title="Tarmac live stream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/50">
              Livestream unavailable
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

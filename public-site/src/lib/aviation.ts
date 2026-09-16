// Live weather via NOAA's Aviation Weather Center
// Data API - free, no key required, confirmed live while building this.
// (Runway/frequency data was originally planned to come from AviationAPI,
// but api.aviationapi.com / docs.aviationapi.com do not resolve - that data
// is static instead, see shared-data/airport-facts.json.)
//
// Ridgeline Regional (KXRG) is fictional, so conditions come from a real
// stand-in reporting station. Override with WEATHER_STATION.
export const WEATHER_STATION = process.env.WEATHER_STATION ?? "KDEN";
const AIRPORT_ID = WEATHER_STATION;

export interface Metar {
  rawOb?: string;
  temp?: number;
  dewp?: number;
  wdir?: number | string;
  wspd?: number;
  visib?: string | number;
  altim?: number;
  wxString?: string;
  reportTime?: string;
  fltCat?: string;
  clouds?: { cover: string; base?: number }[];
}

export interface Taf {
  rawTAF?: string;
  issueTime?: string;
  validTimeFrom?: number;
  validTimeTo?: number;
}

async function safeJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getMetar(): Promise<Metar | null> {
  const data = await safeJson<Metar[]>(
    `https://aviationweather.gov/api/data/metar?ids=${AIRPORT_ID}&format=json`
  );
  return data?.[0] ?? null;
}

export async function getTaf(): Promise<Taf | null> {
  const data = await safeJson<Taf[]>(
    `https://aviationweather.gov/api/data/taf?ids=${AIRPORT_ID}&format=json`
  );
  return data?.[0] ?? null;
}

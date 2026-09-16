import { readFile } from "node:fs/promises";
import path from "node:path";

// Prototype-only: the public site reads shared JSON files directly off disk
// instead of calling a real public read API. In production this would be
// replaced by narrow, read-only API calls to AirportHQ (see the project brief
// - "FBO HQ is the only place data gets written").
const SHARED_DATA_DIR = path.join(process.cwd(), "..", "shared-data");

async function readJson<T>(file: string): Promise<T> {
  const raw = await readFile(path.join(SHARED_DATA_DIR, file), "utf-8");
  return JSON.parse(raw) as T;
}

export interface FuelPrices {
  avgas100LL: { price: number; isPlaceholder: boolean };
  jetAFullServe: { price: number; isPlaceholder: boolean };
  jetASelfServe: { price: number; isPlaceholder: boolean };
  updatedAt: string;
  updatedBy: string;
}

export interface SiteContent {
  facilityName: string;
  airportCode: string;
  airportName: string;
  heroHeadline: string;
  heroSubheadline: string;
  phone: string;
  afterHoursFee: number;
  operatingHours: { day: string; open: string | null; close: string | null }[];
  services: { name: string; icon: string; description: string }[];
  livestreamUrl: string;
}

export interface BusinessDirectory {
  isMockData: boolean;
  listings: {
    name: string;
    category: string;
    description: string;
    contact: string;
    active: boolean;
  }[];
}

export interface AirportFacts {
  source: string;
  sourceEffectiveDate: string;
  icaoId: string;
  faaId: string;
  name: string;
  city: string;
  elevationFt: number;
  controlTower: boolean;
  publicUse: boolean;
  ctafUnicomMhz: string;
  awosMhz: string;
  awosPhone: string;
  runways: {
    id: string;
    lengthFt: number;
    widthFt: number;
    surface: string;
    lighting: string;
    trafficPattern: Record<string, string>;
  }[];
  notes: string[];
}

export const getFuelPrices = () => readJson<FuelPrices>("fuel-prices.json");
export const getSiteContent = () => readJson<SiteContent>("site-content.json");
export const getBusinessDirectory = () =>
  readJson<BusinessDirectory>("business-directory.json");
export const getAirportFacts = () => readJson<AirportFacts>("airport-facts.json");

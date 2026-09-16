import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// AirportHQ is the only place data gets written (by design - the public site only reads).
// Prototype-only: JSON files on disk stand in for the real Postgres backend.
const SHARED_DATA_DIR = path.join(process.cwd(), "..", "shared-data");

function filePath(name: string) {
  return path.join(SHARED_DATA_DIR, `${name}.json`);
}

export async function readJson<T>(name: string): Promise<T> {
  const raw = await readFile(filePath(name), "utf-8");
  return JSON.parse(raw) as T;
}

export async function writeJson<T>(name: string, data: T): Promise<void> {
  await writeFile(filePath(name), JSON.stringify(data, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Types (mirror scripts/convert_july_data.py output)
// ---------------------------------------------------------------------------
export interface TankDay {
  date: string;
  startInventoryGal: number | null;
  gallonsDelivered: number | null;
  gallonsPumped: number | null;
  bookInventoryGal: number | null;
  endStickInches: number | null;
  endStickGal: number | null;
  dailyOverShortGal: number | null;
  cumulativeOverShortGal: number | null;
  initials: string | null;
}
export interface FuelTankLog {
  "100LL": TankDay[];
  jetA: TankDay[];
}

export interface TruckEntry {
  date: string;
  tailNumberOrNote: string | null;
  gallons: number | null;
  runningTotalGal: number | null;
}
export interface TruckLog {
  truck4: { label: string; capacityGal: number; entries: TruckEntry[] };
  truck3: { label: string; capacityGal: number; entries: TruckEntry[] };
}

export interface TimesheetDay {
  date: string;
  day: string | null;
  hours: Record<string, number | null>;
  onCall: string | null;
}
export interface Timesheet {
  employees: string[];
  days: TimesheetDay[];
}

export interface RateHistoryPoint {
  deliveryDate: string;
  rate: number;
}
export interface Customer {
  hangarOrLocation: string | null;
  tailNumber: string;
  aircraftType: string | null;
  owner: string | null;
  attention: string | null;
  paymentMethod: string | null;
  currentRate: number | null;
  jetA: string | null;
  avgas100LL: number | string | null;
  fuelDollar: number | null;
  rateDescription: string | null;
  rateHistory: RateHistoryPoint[];
}
export interface CustomerRates {
  _note: string;
  customers: Customer[];
}

export interface LandingFee {
  date: string;
  tailNumber: string;
  landingFee: number | null;
  overnightFee: number | null;
  tieDownFee: number | null;
  total: number | null;
  salesTax: number | null;
  ccFees: number | null;
  fboShare: number | null;
  airportShare: number | null;
  note: string | null;
}
export interface LandingFees {
  _note: string;
  records: LandingFee[];
}

export interface CcPurchases {
  fboCardTransactions: {
    date: string;
    business: string | null;
    amount: number | null;
    description: string | null;
  }[];
  shopTransactions: {
    date: string;
    vendor: string | null;
    amount: number | null;
    referenceOrStock: string | null;
    tailNumberOrShop: string | null;
  }[];
}

export interface DayTails {
  date: string;
  tailNumbers: (string | null)[];
}
export interface TailGrid {
  _note: string;
  days: DayTails[];
}

export interface CashEntry {
  date: string | null;
  transactionDetails: string | null;
  amount: number | null;
  runningTotal: number | null;
  initials: string | null;
}
export interface CashBox {
  entries: CashEntry[];
}

export interface HangarSettlement {
  hangar: string | null;
  aircraftType: string | null;
  tailNumber: string | null;
  arrivalDate: string | null;
  departureDate: string | null;
  nights: number | null;
  nightlyRate: number | null;
  grossRent: number | null;
  salesTax5pct: number | null;
  avFuelProcessingFee3_5pct: number | null;
  netRent: number | null;
  owner: { name: string; remitTo: string };
  ownerShareLabel: string;
  ownerShareAmount: number;
  adjustments: { note: string; amount: number }[];
  totalDue: number;
  dataQualityFlag?: string;
}
export interface HangarSettlements {
  period: string;
  settlements: HangarSettlement[];
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

// Each source sheet's own month-close block, captured verbatim next to the
// same figure recomputed from the detail rows (see scripts/convert_july_data.py).
export interface LeakCheck {
  gallons: number;
  ratePerGallon: number;
  allowanceGal: number;
  threshold: number;
  equation: string;
  question: string;
  sheetResult: string | null;
  exceeded: boolean;
}
export interface TankMonthEnd {
  totalGallonsPumped: number;
  sheetStatedGallonsPumped: number | null;
  totalOverShortGal: number | null;
  leakCheck: LeakCheck;
  flags: string[];
}
export interface MonthEnd {
  label: string;
  sourceWorkbook: string;
  fuel: { "100LL": TankMonthEnd; jetA: TankMonthEnd };
  landingFees: {
    grossTotal: number | null;
    salesTax: number | null;
    ccFees: number | null;
    netAfterCosts: number;
    eightyPctShare: number | null;
    twentyPctShare: number | null;
    equation: string;
    amountDue: number | null;
    payTo: string | null;
    splitDirectionUnresolved: boolean;
    flags: string[];
  };
  shopPurchases: {
    sheetStatedTotal: number | null;
    computedTotal: number;
    equation: string;
    flags: string[];
  };
  invoices: {
    invoiceNo: string | null;
    date: string | null;
    from: string | null;
    to: string | null;
    re: string | null;
    lineItems: number;
    gallons: number;
    total: number;
  }[];
  hangar: {
    totalNetRents: number;
    ownerShareLabel: string;
    ownerShareAmount: number;
    adjustments: number;
    totalDue: number;
    equation: string;
    flags: string[];
  };
  rentalCar: { monthTotal: number | null; flags: string[] };
}
export interface MonthEndFile {
  _note: string;
  months: Record<string, MonthEnd>;
}

export const getFuelTankLog = () => readJson<FuelTankLog>("fuel-tank-log");
export const saveFuelTankLog = (d: FuelTankLog) => writeJson("fuel-tank-log", d);

export const getTruckLog = () => readJson<TruckLog>("truck-log");

export const getTimesheet = () => readJson<Timesheet>("timesheet");

export const getCustomerRates = () => readJson<CustomerRates>("customer-rates");

export const getLandingFees = () => readJson<LandingFees>("landing-fees");

export const getCcPurchases = () => readJson<CcPurchases>("cc-purchases");

export const getTieDown = () => readJson<TailGrid>("tie-down");
export const getShopStorage = () => readJson<TailGrid>("shop-storage");

export const getCashBox = () => readJson<CashBox>("cash-box");
export const saveCashBox = (d: CashBox) => writeJson("cash-box", d);

export const getHangarSettlements = () => readJson<HangarSettlements>("hangar-settlements");

export const getFuelPrices = () => readJson<FuelPrices>("fuel-prices");
export const saveFuelPrices = (d: FuelPrices) => writeJson("fuel-prices", d);

export const getSiteContent = () => readJson<SiteContent>("site-content");
export const saveSiteContent = (d: SiteContent) => writeJson("site-content", d);

export const getMonthEnd = () => readJson<MonthEndFile>("month-end");

export const getBusinessDirectory = () => readJson<BusinessDirectory>("business-directory");
export const saveBusinessDirectory = (d: BusinessDirectory) =>
  writeJson("business-directory", d);

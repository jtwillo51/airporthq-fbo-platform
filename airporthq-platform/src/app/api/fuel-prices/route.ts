import { NextResponse } from "next/server";
import { getFuelPrices, saveFuelPrices, type FuelPrices } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await getFuelPrices());
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<FuelPrices>;
  const current = await getFuelPrices();
  const updated: FuelPrices = {
    avgas100LL: {
      price: body.avgas100LL?.price ?? current.avgas100LL.price,
      isPlaceholder: false,
    },
    jetAFullServe: {
      price: body.jetAFullServe?.price ?? current.jetAFullServe.price,
      isPlaceholder: false,
    },
    jetASelfServe: {
      price: body.jetASelfServe?.price ?? current.jetASelfServe.price,
      isPlaceholder: false,
    },
    updatedAt: new Date().toISOString().slice(0, 10),
    updatedBy: "admin-prototype",
  };
  await saveFuelPrices(updated);
  return NextResponse.json(updated);
}

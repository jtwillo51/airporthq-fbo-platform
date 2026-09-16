import { NextResponse } from "next/server";
import { getFuelTankLog, saveFuelTankLog, type TankDay } from "@/lib/data";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    tank: "100LL" | "jetA";
    entry: TankDay;
  };
  const current = await getFuelTankLog();
  const updated = {
    ...current,
    [body.tank]: [...current[body.tank], body.entry],
  };
  await saveFuelTankLog(updated);
  return NextResponse.json(updated);
}

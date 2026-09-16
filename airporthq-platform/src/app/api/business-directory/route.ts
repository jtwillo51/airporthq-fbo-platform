import { NextResponse } from "next/server";
import { saveBusinessDirectory, type BusinessDirectory } from "@/lib/data";

export async function PUT(request: Request) {
  const body = (await request.json()) as BusinessDirectory;
  await saveBusinessDirectory(body);
  return NextResponse.json(body);
}

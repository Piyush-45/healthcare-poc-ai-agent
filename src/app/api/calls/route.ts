import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const calls = await prisma.call.findMany({
    orderBy: { createdAt: "desc" },
    include: { patient: true, transcripts: true, costItems: true },
  });
  return NextResponse.json(calls);
}

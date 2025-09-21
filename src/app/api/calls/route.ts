import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const calls = await prisma.call.findMany({
      include: {
        patient: true,
        costItems: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const callsWithCost = calls.map((c) => {
      const totalCost = c.costItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);

      return {
        id: c.id,
        patient: c.patient,
        createdAt: c.createdAt,
        recordingUrl: c.recordingUrl,
        transcript: c.transcript,
        transcriptStatus: c.transcriptStatus,
        costItems: c.costItems,
        totalCost,
      };
    });

    return NextResponse.json(callsWithCost);
  } catch (err) {
    console.error("❌ Error fetching calls:", err);
    return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 });
  }
}

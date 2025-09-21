import { NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";

async function generateXml(callId: string) {
  // Load gender setting from DB
  const settings = await prisma.settings.findFirst();
  const voice = settings?.voiceGender === "female" ? "WOMAN" : "MAN";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${voice}">Hello, this is the hospital calling to check how you are feeling after discharge.</Speak>
  <Record action="${process.env.PUBLIC_URL}/api/webhook/plivo?callId=${callId}"
          method="POST"
          maxLength="60"
          finishOnKey="#"
          playBeep="true" />
</Response>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const callId = searchParams.get("callId") || "";
  const xml = await generateXml(callId);

  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const callId = searchParams.get("callId") || "";
  const xml = await generateXml(callId);

  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}

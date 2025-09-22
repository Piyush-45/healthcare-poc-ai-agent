import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function playUrl(callId: string) {
  return `${process.env.PUBLIC_URL}/api/tts/play?callId=${encodeURIComponent(
    callId
  )}`;
}

async function generateXml(callId: string) {
  const settings = await prisma.settings.findFirst();
  const ttsProvider =
    settings?.ttsProvider || process.env.DEFAULT_TTS_PROVIDER || "elevenlabs";

  if (ttsProvider && ttsProvider !== "plivo") {
    const url = playUrl(callId);
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${url}</Play>
  <Record action="${process.env.PUBLIC_URL}/api/webhook/plivo?callId=${callId}"
          method="POST"
          maxLength="60"
          finishOnKey="#"
          playBeep="true"
          redirect="false"/>
</Response>`;
  }

  // Fallback to Plivo's own voice
  const voice = settings?.voiceGender === "female" ? "WOMAN" : "MAN";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="${voice}">Hello, this is the hospital calling to check how you are feeling after discharge.</Speak>
  <Record action="${process.env.PUBLIC_URL}/api/webhook/plivo?callId=${callId}"
          method="POST"
          maxLength="60"
          finishOnKey="#"
          playBeep="true"
          redirect="false"/>
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

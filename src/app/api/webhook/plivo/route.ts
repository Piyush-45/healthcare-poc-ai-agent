import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startSttAndSaveTranscript } from "@/workers/sttWorker";

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    console.log("📞 Raw Plivo webhook body:", bodyText);

    const params = new URLSearchParams(bodyText);
    const payload = Object.fromEntries(params);
    console.log("📞 Parsed Plivo webhook payload:", payload);

    const callUuid = payload.CallUUID || payload.request_uuid;
    const callStatus = payload.CallStatus || payload.Event;
    const recordUrl = payload.RecordingUrl || payload.RecordUrl;

    // Fallback: callId from query string
    const url = new URL(req.url);
    const callIdQuery = url.searchParams.get("callId");

    const call = await prisma.call.findFirst({ where: { telephonyCallId: callUuid } });
    const targetCallId = call?.id ?? callIdQuery;

    if (!targetCallId) {
      console.warn("⚠️ No matching call found for webhook");
      return NextResponse.json({ ok: true });
    }

    // Update DB with status + recording
    if (callStatus?.toLowerCase() === "completed" || callStatus?.toLowerCase() === "hangup") {
      await prisma.call.update({
        where: { id: targetCallId },
        data: {
          status: "completed",
          endedAt: new Date(),
          recordingUrl: recordUrl || undefined,
        },
      });

      if (recordUrl) {
        console.log("🎤 Recording available:", recordUrl);
        await startSttAndSaveTranscript(targetCallId, recordUrl);
      } else {
        console.warn("⚠️ No RecordUrl in webhook payload");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

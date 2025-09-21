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
    const recordUrl = payload.RecordingUrl || payload.RecordUrl;
    const callStatus = payload.CallStatus || payload.Event;

    const url = new URL(req.url);
    const callIdQuery = url.searchParams.get("callId");

    const call = await prisma.call.findFirst({ where: { telephonyCallId: callUuid } });
    const targetCallId = call?.id ?? callIdQuery;

    if (!targetCallId) {
      console.warn("⚠️ No matching call found for webhook");
      return NextResponse.json({ ok: true });
    }

    // ✅ Save recording as soon as we have it
    if (recordUrl) {
      console.log(`🎤 Recording received: ${recordUrl}`);
      await prisma.call.update({
        where: { id: targetCallId },
        data: {
          recordingUrl: recordUrl,
          status: callStatus?.toLowerCase() === "completed" ? "completed" : "in-progress",
        },
      });

      // Kick off STT right away
      await startSttAndSaveTranscript(targetCallId, recordUrl);
    } else {
      console.warn("⚠️ No RecordUrl in webhook payload");
    }

    // ✅ Also mark call completed at the end
    if (callStatus?.toLowerCase() === "completed") {
      await prisma.call.update({
        where: { id: targetCallId },
        data: { status: "completed", endedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { startSttAndSaveTranscript } from "../../../../workers/sttWorker";

export async function POST(req: NextRequest) {
  try {
    // Plivo sends webhooks as x-www-form-urlencoded, not JSON
    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);

    const callUuid = params.get("CallUUID") || params.get("request_uuid");
    const callStatus = params.get("CallStatus") || params.get("Event");
    const recordUrl = params.get("RecordingUrl") || params.get("RecordUrl");

    console.log("📞 Plivo webhook payload:", Object.fromEntries(params));

    // If call not found by CallUUID, check ?callId in query string
    const url = new URL(req.url);
    const callIdQuery = url.searchParams.get("callId");

    let call = null;
    if (callUuid) {
      call = await prisma.call.findFirst({ where: { telephonyCallId: callUuid } });
    }
    const targetCallId = call?.id ?? callIdQuery;

    if (!targetCallId) {
      console.warn("⚠️ No matching call found for webhook");
      return NextResponse.json({ ok: true });
    }

    // Update call record
    if (callStatus?.toLowerCase() === "completed" || callStatus?.toLowerCase() === "hangup") {
      await prisma.call.update({
        where: { id: targetCallId },
        data: {
          status: "completed",
          endedAt: new Date(),
          recordingUrl: recordUrl || undefined,
        },
      });

      // Kick off STT worker if recording available
      if (recordUrl) {
        await startSttAndSaveTranscript(targetCallId, recordUrl);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

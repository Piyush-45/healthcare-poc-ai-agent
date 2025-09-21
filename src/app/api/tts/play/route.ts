import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTTSAdapter } from "@/lib/providers/ttsFactory";

const audioCache = new Map<
  string,
  { buffer: Buffer; contentType: string; expiresAt: number }
>();
const CACHE_TTL_MS = 1000 * 60 * 15;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const callId = url.searchParams.get("callId");
    if (!callId) return new Response("callId required", { status: 400 });

    const cacheKey = `tts:${callId}`;
    const cached = audioCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(new Uint8Array(cached.buffer), {
        status: 200,
        headers: { "Content-Type": cached.contentType },
      });
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { patient: true },
    });
    const settings = await prisma.settings.findFirst();

    const patientName = call?.patient?.name || "Patient";
    const gender = (settings?.voiceGender as "male" | "female") || "male";

    const text = `Hello ${patientName}, this is the hospital calling to check how you are feeling after discharge. Please speak after the beep.`;

    const adapter = await getTTSAdapter();
    const result = await adapter.synthesize(text, { gender });

    // ✅ Cost logging
    try {
      const provider = (
        settings?.ttsProvider || process.env.DEFAULT_TTS_PROVIDER || "plivo"
      ).toLowerCase();

      if (provider === "azure") {
        const charCount = text.length;
        const unitCost = 0.000016; // $16 per 1M chars
        const totalCost = charCount * unitCost;

        await prisma.costItem.create({
          data: {
            callId,
            category: "tts",
            provider: "azure",
            units: charCount,
            unitCost,
            totalCost,
          },
        });
        console.log(
          `💰 Azure TTS cost logged: $${totalCost.toFixed(
            4
          )} for ${charCount} chars`
        );
      }

      if (provider === "elevenlabs") {
        const charCount = text.length;
        const unitCost = 0.0003; // $0.30 / 1k chars
        const totalCost = charCount * unitCost;

        await prisma.costItem.create({
          data: {
            callId,
            category: "tts",
            provider: "elevenlabs",
            units: charCount,
            unitCost,
            totalCost,
          },
        });
        console.log(
          `💰 ElevenLabs TTS cost logged: $${totalCost.toFixed(
            4
          )} for ${charCount} chars`
        );
      }

      if (provider === "google") {
        const charCount = text.length;
        const unitCost = 0.000016; // $16 / 1M chars (same as Azure)
        const totalCost = charCount * unitCost;

        await prisma.costItem.create({
          data: {
            callId,
            category: "tts",
            provider: "google",
            units: charCount,
            unitCost,
            totalCost,
          },
        });
        console.log(
          `💰 Google TTS cost logged: $${totalCost.toFixed(
            4
          )} for ${charCount} chars`
        );
      }

      // Plivo <Speak> = free, skip cost logging
    } catch (err) {
      console.warn("⚠️ Failed to log TTS cost", err);
    }

    // ✅ Cache audio
    audioCache.set(cacheKey, {
      buffer: result.audioBuffer,
      contentType: result.contentType,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return new Response(new Uint8Array(result.audioBuffer), {
      status: 200,
      headers: { "Content-Type": result.contentType },
    });
  } catch (err) {
    console.error("TTS play error:", err);
    return new Response("TTS error", { status: 500 });
  }
}

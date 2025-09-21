// workers/sttWorker.ts
import { prisma } from "@/lib/prisma";
import fetch from "node-fetch"; // ensure installed: npm install node-fetch

/**
 * Detect STT language from Azure voice or fallback to English
 */
function detectLangForSTT(voiceName?: string): string {
  if (!voiceName) return "en";
  if (voiceName.startsWith("hi-")) return "hi"; // Hindi
  if (voiceName.startsWith("mr-")) return "mr"; // Marathi
  return "en"; // default English
}

/**
 * Call Deepgram API for STT
 */
async function runDeepgram(audioUrl: string, language: string): Promise<{ text: string; duration: number }> {
  if (!process.env.DEEPGRAM_API_KEY) {
    throw new Error("DEEPGRAM_API_KEY not set");
  }

  console.log(`🎧 Sending audio to Deepgram [lang=${language}]:`, audioUrl);

  const resp = await fetch("https://api.deepgram.com/v1/listen", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: audioUrl, language }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Deepgram API failed: ${resp.status} ${errText}`);
  }

  const data: any = await resp.json();
  console.log("📄 Deepgram raw response:", JSON.stringify(data, null, 2));

  const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
  const duration = data.metadata?.duration || 0;

  return { text: transcript.trim(), duration };
}

/**
 * Start STT and save transcript + cost to DB
 */
export async function startSttAndSaveTranscript(callId: string, audioUrl: string) {
  try {
    console.log(`🚀 STT job starting for callId=${callId}, url=${audioUrl}`);

    // Mark transcript as pending
    await prisma.call.update({
      where: { id: callId },
      data: { transcriptStatus: "pending" },
    });

    // Detect language from settings
    const settings = await prisma.settings.findFirst();
    const lang = detectLangForSTT(settings?.azureVoiceName);

    // Run Deepgram
    const { text, duration } = await runDeepgram(audioUrl, lang);

    if (!text) {
      console.warn("⚠️ Deepgram returned empty transcript");
      await prisma.call.update({
        where: { id: callId },
        data: { transcriptStatus: "failed" },
      });
      return;
    }

    // Save transcript
    await prisma.call.update({
      where: { id: callId },
      data: {
        transcript: text,
        transcriptStatus: "completed",
      },
    });

    console.log("✅ Deepgram transcript saved:", text);

    // Save cost (Deepgram $0.006 / min for standard model)
    const costPerMinute = 0.006;
    const totalCost = (duration / 60) * costPerMinute;

    await prisma.costItem.create({
      data: {
        callId,
        category: "stt",
        provider: "deepgram",
        units: duration / 60, // minutes
        unitCost: costPerMinute,
        totalCost,
      },
    });

    console.log(`💰 STT cost logged: $${totalCost.toFixed(4)} for ${duration.toFixed(2)}s`);
  } catch (err: any) {
    console.error("❌ STT worker error:", err);

    await prisma.call.update({
      where: { id: callId },
      data: { transcriptStatus: "failed" },
    });
  }
}

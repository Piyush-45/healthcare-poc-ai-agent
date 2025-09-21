
// @ts-expect-error no types for mp3-duration
import mp3Duration from "mp3-duration";
import { prisma } from "@/lib/prisma";
import fetch from "node-fetch"; // Deepgram
import { SpeechClient } from "@google-cloud/speech"; // Google

/**
 * Detect STT language from Azure/Deepgram voice or fallback to English
 */
function detectLangForSTT(voiceName?: string): string {
  if (!voiceName) return "en";
  if (voiceName.startsWith("hi-")) return "hi"; // Hindi
  if (voiceName.startsWith("mr-")) return "mr"; // Marathi
  return "en"; // default English
}

/**
 * Run Deepgram STT
 */
async function runDeepgram(
  audioUrl: string,
  language: string
): Promise<{ text: string; duration: number }> {
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

  const transcript =
    data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
  const duration = data.metadata?.duration || 0;

  return { text: transcript.trim(), duration };
}

/**
 * Run Google STT
 */



async function runGoogleSTT(
  audioUrl: string,
  languageCode = "en-US"
): Promise<{ text: string; duration: number | null }> {
  const client = new SpeechClient();

  // Fetch MP3 from Plivo URL
  const resp = await fetch(audioUrl);
  if (!resp.ok) {
    throw new Error(`Failed to fetch audio from ${audioUrl}: ${resp.status}`);
  }
  const audioBuffer = Buffer.from(await resp.arrayBuffer());

  // ✅ Get MP3 duration in seconds
  let duration: number | null = null;
  try {
    duration = await new Promise<number>((resolve, reject) => {
      mp3Duration(audioBuffer, (err: Error | null, seconds: number) => {
        if (err) reject(err);
        else resolve(seconds);
      });
    });
  } catch (err) {
    console.warn("⚠️ Could not calculate MP3 duration:", err);
  }

  // Send audio to Google STT as base64
  const request = {
    audio: { content: audioBuffer.toString("base64") },
    config: {
      encoding: "MP3",
      sampleRateHertz: 8000,
      languageCode,
      enableAutomaticPunctuation: true,
    },
  };

  const [response] = await client.recognize(request as any);
  const results = response.results || [];

  const transcript = results
    .map((r) => r.alternatives?.[0]?.transcript || "")
    .join(" ")
    .trim();

  return { text: transcript, duration };
}

/**
 * Start STT and save transcript + cost
 */
export async function startSttAndSaveTranscript(
  callId: string,
  audioUrl: string
) {
  try {
    console.log(`🚀 STT job starting for callId=${callId}, url=${audioUrl}`);

    // Mark transcript as pending
    await prisma.call.update({
      where: { id: callId },
      data: { transcriptStatus: "pending" },
    });

    // Detect provider
    const settings = await prisma.settings.findFirst();
    const sttProvider =
      settings?.sttProvider || process.env.STT_PROVIDER || "deepgram";

    let text = "";
    let duration: number | null = null;

    if (sttProvider === "google") {
      const lang = settings?.googleLanguage || "en-US";
      console.log(`[GoogleSTT] using lang=${lang}`);
      const result = await runGoogleSTT(audioUrl, lang);
      text = result.text;
      duration = result.duration;
    } else {
      const lang = detectLangForSTT(settings?.azureVoiceName);
      const result = await runDeepgram(audioUrl, lang);
      text = result.text;
      duration = result.duration;
    }

    if (!text) {
      console.warn("⚠️ STT returned empty transcript");
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

    console.log("✅ Transcript saved:", text);

    // Save cost
    if (sttProvider === "deepgram" && duration) {
      const costPerMinute = 0.006; // Deepgram standard
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
      console.log(
        `💰 Deepgram STT cost logged: $${totalCost.toFixed(
          4
        )} for ${duration.toFixed(2)}s`
      );
    }

    if (sttProvider === "google" && duration) {
      const costPerMinute = 0.024; // ~$0.006 per 15s = $0.024/min
      const totalCost = (duration / 60) * costPerMinute;

      await prisma.costItem.create({
        data: {
          callId,
          category: "stt",
          provider: "google",
          units: duration / 60,
          unitCost: costPerMinute,
          totalCost,
        },
      });
      console.log(
        `💰 Google STT cost logged: $${totalCost.toFixed(
          4
        )} for ${duration.toFixed(2)}s`
      );
    }
  } catch (err: any) {
    console.error("❌ STT worker error:", err);

    await prisma.call.update({
      where: { id: callId },
      data: { transcriptStatus: "failed" },
    });
  }
}

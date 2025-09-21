import { prisma } from "../lib/prisma";
import { createClient } from "@deepgram/sdk";
import axios from "axios";

export async function startSttAndSaveTranscript(callId: string, recordingUrl: string) {
  console.log("STT job starting for", callId, recordingUrl);

  try {
    if (process.env.STT_PROVIDER === "deepgram" && process.env.DEEPGRAM_API_KEY) {
      const dgClient = createClient(process.env.DEEPGRAM_API_KEY);

      // 1. Download the Plivo recording (auth required)
      const resp = await axios.get(recordingUrl, {
        auth: {
          username: process.env.PLIVO_AUTH_ID!,
          password: process.env.PLIVO_AUTH_TOKEN!,
        },
        responseType: "arraybuffer",
      });
      const audioBuffer = Buffer.from(resp.data);

      // 2. Send audio buffer to Deepgram
      const response = await dgClient.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model: "nova-2",
          smart_format: true,
          punctuate: true,
          detect_language: true,
        }
      );

      // 3. Extract transcript + metadata
      const transcriptText =
        response.result.results.channels[0].alternatives[0].transcript || "";
      const language =
        response.result.results.channels[0].alternatives[0].language || "unknown";
      const duration =
        response.result.metadata?.duration || 0;

      // 4. Save transcript
      await prisma.transcript.create({
        data: {
          callId,
          provider: "deepgram",
          language,
          text: transcriptText,
        },
      });

      // 5. Save cost (Deepgram Nova-2 ~ $0.0048/minute)
      const unitCost = 0.0048 / 60; // cost per second
      const totalCost = duration * unitCost;

      await prisma.costItem.create({
        data: {
          callId,
          category: "stt",
          provider: "deepgram",
          units: duration,
          unitCost,
          totalCost,
        },
      });

      console.log("✅ Deepgram transcript saved:", transcriptText);
    } else {
      console.warn("⚠️ Deepgram not configured, skipping STT");
    }
  } catch (err) {
    console.error("❌ STT error:", err);
  }
}

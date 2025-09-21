// src/lib/tts/google.ts
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { TTSAdapter, TTSResult, VoiceGender } from "./types";

export default class GoogleTTSAdapter implements TTSAdapter {
  client: TextToSpeechClient;

  constructor() {
    this.client = new TextToSpeechClient();
  }

  /**
   * Synthesize text to MP3 using Google Cloud TTS.
   * opts.voiceId (optional) can be passed to choose a specific voice name.
   * opts.languageCode (optional) e.g. "hi-IN", "mr-IN", "en-US"
   */
  async synthesize(
    text: string,
    opts?: { gender?: VoiceGender; voiceId?: string; languageCode?: string }
  ): Promise<TTSResult> {
    const languageCode = opts?.languageCode || "en-US";
    const ssmlGender = opts?.gender === "female" ? "FEMALE" : "MALE";

    const request = {
      input: { text },
      voice: {
        languageCode,
        ssmlGender: ssmlGender as any,
        name: opts?.voiceId || undefined, // optionally pass a specific Google voice
      },
      audioConfig: {
        audioEncoding: "MP3",
      },
    };

    // Call Google
    const [response] = await this.client.synthesizeSpeech(request as any);

    // response.audioContent may be a base64 string or a Buffer-like value depending on environment.
    const audioContent: any = (response as any).audioContent;
    if (!audioContent) {
      throw new Error("Google TTS returned no audio");
    }

    // Normalize to Buffer safely
    let audioBuffer: Buffer;
    if (typeof audioContent === "string") {
      // Often it's base64 string
      try {
        audioBuffer = Buffer.from(audioContent, "base64");
      } catch {
        // fallback to binary
        audioBuffer = Buffer.from(audioContent, "binary");
      }
    } else {
      // If SDK returned a Buffer-like object
      audioBuffer = Buffer.from(audioContent as Buffer);
    }

    return {
      audioBuffer,
      contentType: "audio/mpeg",
    };
  }
}

// lib/tts/azure.ts
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { TTSAdapter, TTSResult, VoiceGender } from "./types";

export default class AzureTTSAdapter implements TTSAdapter {
  subscriptionKey: string;
  region: string;
  defaultMaleVoice?: string;
  defaultFemaleVoice?: string;
  overrideVoice?: string;

  constructor(opts: { subscriptionKey: string; region: string; defaultMaleVoice?: string; defaultFemaleVoice?: string; overrideVoice?: string }) {
    this.subscriptionKey = opts.subscriptionKey;
    this.region = opts.region;
    this.defaultMaleVoice = opts.defaultMaleVoice;
    this.defaultFemaleVoice = opts.defaultFemaleVoice;
    this.overrideVoice = opts.overrideVoice;
  }

  async synthesize(text: string, opts: { gender?: VoiceGender; voiceId?: string }): Promise<TTSResult> {
    const voiceName =
      this.overrideVoice ||
      opts.voiceId ||
      (opts.gender === "female" ? this.defaultFemaleVoice : this.defaultMaleVoice) ||
      (opts.gender === "female" ? "en-US-JennyNeural" : "en-US-GuyNeural");

    console.log(`[AzureTTS] synthesize using voice=${voiceName}`);

    const speechConfig = sdk.SpeechConfig.fromSubscription(this.subscriptionKey, this.region);
    speechConfig.speechSynthesisVoiceName = voiceName;

    // try to pick MP3 output if available
    try {
      // @ts-ignore
      speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3;
    } catch (e) {
      console.warn("AzureTTS: could not set mp3 format, falling back to default.", e);
    }

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    return new Promise<TTSResult>((resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        (result) => {
          try {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              const audioData: any = (result as any).audioData;
              const buffer = Buffer.from(audioData as ArrayBuffer);

              // guess content type
              let contentType = "audio/wav";
              if (buffer.length >= 3 && buffer.slice(0, 3).toString() === "ID3") contentType = "audio/mpeg";
              else if (buffer.length > 4 && buffer.slice(0, 4).toString() !== "RIFF") contentType = "audio/mpeg";

              resolve({
                audioBuffer: buffer,
                contentType,
                durationSeconds: undefined,
                cost: undefined,
              });
            } else {
              const err = (result as any).errorDetails || `Azure TTS failed (reason=${result.reason})`;
              reject(new Error(err));
            }
          } finally {
            try { synthesizer.close(); } catch {}
          }
        },
        (err) => {
          try { synthesizer.close(); } catch {}
          reject(err);
        }
      );
    });
  }
}

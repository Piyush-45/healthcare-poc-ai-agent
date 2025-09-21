import ElevenLabsAdapter from "@/lib/tts/elevenlabs";
import AzureTTSAdapter from "@/lib/tts/azure";
import { TTSAdapter } from "@/lib/tts/types";
import { prisma } from "@/lib/prisma";

export async function getTTSAdapter(): Promise<TTSAdapter> {
  const settings = await prisma.settings.findFirst();
  const providerName = (settings?.ttsProvider || process.env.DEFAULT_TTS_PROVIDER || "plivo").toLowerCase();

  if (providerName === "elevenlabs") {
    return new ElevenLabsAdapter({
      apiKey: process.env.ELEVENLABS_API_KEY!,
      defaultMaleVoiceId: settings?.eleven_male_voice || process.env.ELEVENLABS_VOICE_MALE_ID,
      defaultFemaleVoiceId: settings?.eleven_female_voice || process.env.ELEVENLABS_VOICE_FEMALE_ID,
    });
  }

  if (providerName === "azure") {
    return new AzureTTSAdapter({
      subscriptionKey: process.env.AZURE_TTS_KEY!,
      region: process.env.AZURE_TTS_REGION!,
      defaultMaleVoice: "en-US-GuyNeural",
      defaultFemaleVoice: "en-US-JennyNeural",
      overrideVoice: settings?.azureVoiceName || undefined, // 👈 load from DB
    });
  }

  throw new Error(`Unsupported TTS provider: ${providerName}`);
}

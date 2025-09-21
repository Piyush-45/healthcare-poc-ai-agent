import ElevenLabsAdapter from '@/lib/tts/elevenlabs';
import { TTSAdapter } from '@/lib/tts/types';
import { prisma } from '@/lib/prisma';

export async function getTTSAdapter(): Promise<TTSAdapter> {
  const settings = await prisma.settings.findFirst();
  const providerName = (settings?.ttsProvider || process.env.DEFAULT_TTS_PROVIDER || 'plivo').toLowerCase();

  if (providerName === 'elevenlabs') {
    if (!process.env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY missing');

    return new ElevenLabsAdapter({
      apiKey: process.env.ELEVENLABS_API_KEY,
      defaultMaleVoiceId: settings?.eleven_male_voice || process.env.ELEVENLABS_VOICE_MALE_ID,
      defaultFemaleVoiceId: settings?.eleven_female_voice || process.env.ELEVENLABS_VOICE_FEMALE_ID,
    });
  }

  // TODO: add azure/google later
  throw new Error(`Unsupported TTS provider: ${providerName}`);
}

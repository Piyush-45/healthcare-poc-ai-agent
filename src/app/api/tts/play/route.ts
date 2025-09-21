import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTTSAdapter } from '@/lib/providers/ttsFactory';

// simple in-memory cache: Map<key, { buffer, contentType, expiry }>
const audioCache = new Map<string, { buffer: Buffer; contentType: string; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const callId = url.searchParams.get('callId') || '';
    if (!callId) return new Response('callId required', { status: 400 });

    // If cached, return
    const cacheKey = `call:${callId}`;
    const cached = audioCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(cached.buffer, { status: 200, headers: { 'Content-Type': cached.contentType, 'Cache-Control': 'public, max-age=300' }});
    }

    // Load call + settings to generate TTS content
    const call = await prisma.call.findUnique({ where: { id: callId }, include: { patient: true } });
    const settings = await prisma.settings.findFirst();

    if (!call) return new Response('call not found', { status: 404 });

    // Build the TTS text — replace with your template or LLM in future
    const patientName = call.patient?.name || 'Patient';
    const ttsText = `Hello ${patientName}, this is the hospital calling to check how you are feeling after discharge. Please say how you are feeling after the beep. Press # when finished.`;

    // pick provider from settings
    const ttsProvider = settings?.ttsProvider || process.env.DEFAULT_TTS_PROVIDER || 'elevenlabs';
    const gender = (settings?.voiceGender as 'male' | 'female') || 'male';

    const adapter = getTTSAdapter(ttsProvider);
    const voiceId = settings?.eleven_male_voice && settings?.eleven_female_voice ? (gender === 'female' ? settings.eleven_female_voice : settings.eleven_male_voice) : undefined;

    const result = await adapter.synthesize(ttsText, { gender, voiceId });

    // cache and return
    audioCache.set(cacheKey, { buffer: result.audioBuffer, contentType: result.contentType, expiresAt: Date.now() + CACHE_TTL_MS });

    return new Response(result.audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (err: any) {
    console.error('TTS play error', err);
    return new Response('TTS error', { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTTSAdapter } from "@/lib/providers/ttsFactory";

const audioCache = new Map<string, { buffer: Buffer; contentType: string; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 15;

// Localized messages
const MESSAGES: Record<string, { male: string; female: string }> = {
  hi: {
    male: "नमस्ते, अस्पताल की ओर से आपका हालचाल जानने के लिए कॉल किया गया है। कृपया बीप के बाद अपनी स्थिति बताएं।",
    female: "नमस्ते, अस्पताल की ओर से आपका हालचाल जानने के लिए कॉल किया गया है। बीप के बाद अपनी बात बताएं।",
  },
  mr: {
    male: "नमस्कार, रुग्णालयाच्या वतीने आपली प्रकृती कशी आहे हे विचारण्यासाठी कॉल केला आहे. कृपया बीप नंतर बोला.",
    female: "नमस्कार, रुग्णालयाच्या वतीने आपली प्रकृती कशी आहे हे विचारण्यासाठी कॉल केला आहे. बीप नंतर बोला.",
  },
  en: {
    male: "Hello, this is the hospital calling to check how you are feeling after discharge. Please speak after the beep.",
    female: "Hello, this is the hospital calling to check how you are feeling after discharge. Speak after the beep.",
  },
};

// Detect language based on Azure voice name prefix
function detectLangFromVoice(voiceName?: string): "hi" | "mr" | "en" {
  if (!voiceName) return "en";
  if (voiceName.startsWith("hi-")) return "hi"; // Hindi voices
  if (voiceName.startsWith("mr-")) return "mr"; // Marathi voices
  return "en";
}

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

    const gender = (settings?.voiceGender as "male" | "female") || "male";
    const voiceName = settings?.azureVoiceName;
    const lang = detectLangFromVoice(voiceName);

    // Pick localized text
    const text = MESSAGES[lang][gender];
    console.log(`[TTS.play] lang=${lang}, gender=${gender}, voice=${voiceName}, text="${text}"`);

    const adapter = await getTTSAdapter();
    const result = await adapter.synthesize(text, { gender });

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

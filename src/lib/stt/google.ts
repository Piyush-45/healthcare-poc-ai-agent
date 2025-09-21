import { SpeechClient } from "@google-cloud/speech";

export async function runGoogleSTT(
  audioUrl: string,
  languageCode = "en-US"
): Promise<{ text: string; duration: number | null }> {
  const client = new SpeechClient();

  const request = {
    audio: { uri: audioUrl },
    config: {
      encoding: "MP3", // Plivo recordings are MP3
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

  // Google STT doesn't return duration — we'll set null for now
  return { text: transcript, duration: null };
}

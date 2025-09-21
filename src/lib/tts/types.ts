export type VoiceGender = 'male' | 'female';

export interface TTSResult {
  audioBuffer: Buffer;
  contentType: string; // e.g. "audio/mpeg"
  durationSeconds?: number;
  cost?: number;
}

export interface TTSAdapter {
  synthesize(text: string, opts: { gender?: VoiceGender; voiceId?: string }): Promise<TTSResult>;
}

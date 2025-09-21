import axios from 'axios';
import { TTSAdapter, TTSResult, VoiceGender } from './types';

const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';

export default class ElevenLabsAdapter implements TTSAdapter {
  apiKey: string;
  defaultMaleVoiceId?: string;
  defaultFemaleVoiceId?: string;

  constructor(opts: { apiKey: string; defaultMaleVoiceId?: string; defaultFemaleVoiceId?: string; }) {
    this.apiKey = opts.apiKey;
    this.defaultMaleVoiceId = opts.defaultMaleVoiceId;
    this.defaultFemaleVoiceId = opts.defaultFemaleVoiceId;
  }

  async synthesize(text: string, opts: { gender?: VoiceGender; voiceId?: string }): Promise<TTSResult> {
    const voiceId = opts.voiceId || (opts.gender === 'female' ? this.defaultFemaleVoiceId : this.defaultMaleVoiceId);
    if (!voiceId) throw new Error('ElevenLabs: voiceId not provided');

    // ElevenLabs API: POST /v1/text-to-speech/{voice_id}
    const url = `${ELEVEN_BASE}/text-to-speech/${voiceId}`;
    const payload = {
      text,
      // optional voice_settings param could be added here
    };

    const resp = await axios.post(url, payload, {
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer' // receive binary audio
    });

    const contentType = resp.headers['content-type'] || 'audio/mpeg';
    const audioBuffer = Buffer.from(resp.data);

    // duration estimation is optional (ElevenLabs may not return metadata)
    return {
      audioBuffer,
      contentType,
      durationSeconds: undefined,
      cost: undefined
    };
  }
}

'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const AZURE_VOICES = [
  { label: "English (US) - Jenny (Female)", value: "en-US-JennyNeural" },
  { label: "English (US) - Guy (Male)", value: "en-US-GuyNeural" },
  { label: "Hindi (IN) - Swara (Female)", value: "hi-IN-SwaraNeural" },
  { label: "Hindi (IN) - Madhur (Male)", value: "hi-IN-MadhurNeural" },
  // { label: "Marathi (IN) - Aarav (Male)", value: "mr-IN-AaravNeural" },
  // { label: "Marathi (IN) - Ananya (Female)", value: "mr-IN-AnanyaNeural" },
];

export default function SettingsPage() {
  const [voiceGender, setVoiceGender] = useState('male');
  const [sttProvider, setSttProvider] = useState('deepgram');
  const [ttsProvider, setTtsProvider] = useState('elevenlabs');
  const [elevenMale, setElevenMale] = useState('');
  const [elevenFemale, setElevenFemale] = useState('');
  const [azureVoiceName, setAzureVoiceName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);
  async function fetchSettings() {
    const r = await fetch('/api/settings');
    const j = await r.json();
    setVoiceGender(j.voiceGender || 'male');
    setSttProvider(j.sttProvider || 'deepgram');
    setTtsProvider(j.ttsProvider || 'elevenlabs');
    setElevenMale(j.eleven_male_voice || '');
    setElevenFemale(j.eleven_female_voice || '');
    setAzureVoiceName(j.azureVoiceName || '');
  }

  async function save() {
    setSaving(true);
    await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({
      voiceGender, sttProvider, ttsProvider,
      eleven_male_voice: elevenMale,
      eleven_female_voice: elevenFemale,
      azureVoiceName,
    })});
    setSaving(false);
    alert('Saved');
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      <div className="space-y-4">
        {/* Voice gender toggle */}
        <div>
          <label className="block text-sm font-medium">Voice gender</label>
          <select value={voiceGender} onChange={(e) => setVoiceGender(e.target.value)} className="mt-1 block w-48">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* STT provider */}
        <div>
          <label className="block text-sm font-medium">STT provider</label>
          <select value={sttProvider} onChange={(e) => setSttProvider(e.target.value)} className="mt-1 block w-48">
            <option value="deepgram">Deepgram</option>
            <option value="whisper">OpenAI Whisper</option>
            <option value="azure">Azure</option>
            <option value="google">Google</option>
          </select>
        </div>

        {/* TTS provider */}
        <div>
          <label className="block text-sm font-medium">TTS provider</label>
          <select value={ttsProvider} onChange={(e) => setTtsProvider(e.target.value)} className="mt-1 block w-48">
            <option value="plivo">Plivo (built-in)</option>
            <option value="elevenlabs">ElevenLabs</option>
            <option value="azure">Azure TTS</option>
            <option value="google">Google TTS</option>
          </select>
        </div>

        {/* ElevenLabs input */}
        {ttsProvider === 'elevenlabs' && (
          <div>
            <p className="text-sm text-slate-600">ElevenLabs voice IDs (optional):</p>
            <input placeholder="male voice id" value={elevenMale} onChange={e => setElevenMale(e.target.value)} className="mt-1 block w-full" />
            <input placeholder="female voice id" value={elevenFemale} onChange={e => setElevenFemale(e.target.value)} className="mt-1 block w-full" />
          </div>
        )}

        {/* Azure dropdown */}
        {ttsProvider === 'azure' && (
          <div>
            <label className="block text-sm font-medium">Azure Voice</label>
            <select
              value={azureVoiceName}
              onChange={(e) => setAzureVoiceName(e.target.value)}
              className="mt-1 block w-full"
            >
              <option value="">-- Select Voice --</option>
              {AZURE_VOICES.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              These are curated Azure voices (English, Hindi, Marathi). More can be added later.
            </p>
          </div>
        )}

        <div>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</Button>
        </div>
      </div>
    </div>
  );
}

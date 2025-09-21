'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const [voiceGender, setVoiceGender] = useState('male');
  const [sttProvider, setSttProvider] = useState('deepgram');
  const [ttsProvider, setTtsProvider] = useState('elevenlabs');
  const [elevenMale, setElevenMale] = useState('');
  const [elevenFemale, setElevenFemale] = useState('');
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
  }

  async function save() {
    setSaving(true);
    await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({
      voiceGender, sttProvider, ttsProvider, eleven_male_voice: elevenMale, eleven_female_voice: elevenFemale
    })});
    setSaving(false);
    alert('Saved');
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Voice gender</label>
          <select value={voiceGender} onChange={(e) => setVoiceGender(e.target.value)} className="mt-1 block w-48">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">STT provider</label>
          <select value={sttProvider} onChange={(e) => setSttProvider(e.target.value)} className="mt-1 block w-48">
            <option value="deepgram">Deepgram</option>
            <option value="whisper">OpenAI Whisper</option>
            <option value="azure">Azure</option>
            <option value="google">Google</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">TTS provider</label>
          <select value={ttsProvider} onChange={(e) => setTtsProvider(e.target.value)} className="mt-1 block w-48">
            <option value="plivo">Plivo (built-in)</option>
            <option value="elevenlabs">ElevenLabs</option>
            <option value="azure">Azure</option>
            <option value="google">Google</option>
          </select>
        </div>

        <div>
          <p className="text-sm text-slate-600">ElevenLabs voice IDs (optional):</p>
          <input placeholder="male voice id" value={elevenMale} onChange={e => setElevenMale(e.target.value)} className="mt-1 block w-full" />
          <input placeholder="female voice id" value={elevenFemale} onChange={e => setElevenFemale(e.target.value)} className="mt-1 block w-full" />
          <p className="text-xs text-slate-500 mt-1">If left blank, env defaults ELEVENLABS_VOICE_MALE_ID / _FEMALE_ID are used.</p>
        </div>

        <div>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</Button>
        </div>
      </div>
    </div>
  );
}

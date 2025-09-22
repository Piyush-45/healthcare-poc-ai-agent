"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AZURE_VOICES = [
  { label: "English (US) - Jenny (Female)", value: "en-US-JennyNeural" },
  { label: "English (US) - Guy (Male)", value: "en-US-GuyNeural" },
  { label: "Hindi (IN) - Swara (Female)", value: "hi-IN-SwaraNeural" },
  { label: "Hindi (IN) - Madhur (Male)", value: "hi-IN-MadhurNeural" },
];

const GOOGLE_LANGS = [
  { label: "English (US)", value: "en-US" },
  { label: "English (UK)", value: "en-GB" },
  { label: "Hindi (India)", value: "hi-IN" },
  { label: "Marathi (India)", value: "mr-IN" },
  { label: "Bengali (India)", value: "bn-IN" },
];

export default function SettingsPage() {
  const [voiceGender, setVoiceGender] = useState("male");
  const [sttProvider, setSttProvider] = useState("deepgram");
  const [ttsProvider, setTtsProvider] = useState("elevenlabs");
  const [elevenMale, setElevenMale] = useState("");
  const [elevenFemale, setElevenFemale] = useState("");
  const [azureVoiceName, setAzureVoiceName] = useState("");
  const [googleLanguage, setGoogleLanguage] = useState("en-US");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const r = await fetch("/api/settings");
    const j = await r.json();
    setVoiceGender(j.voiceGender || "male");
    setSttProvider(j.sttProvider || "deepgram");
    setTtsProvider(j.ttsProvider || "elevenlabs");
    setElevenMale(j.eleven_male_voice || "");
    setElevenFemale(j.eleven_female_voice || "");
    setAzureVoiceName(j.azureVoiceName || "");
    setGoogleLanguage(j.googleLanguage || "en-US");
  }

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voiceGender,
        sttProvider,
        ttsProvider,
        eleven_male_voice: elevenMale,
        eleven_female_voice: elevenFemale,
        azureVoiceName,
        googleLanguage,
      }),
    });
    setSaving(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Voice Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Voice gender</Label>
            <Select value={voiceGender} onValueChange={setVoiceGender}>
              <SelectTrigger className="w-48 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Speech-to-Text (STT)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Provider</Label>
            <Select value={sttProvider} onValueChange={setSttProvider}>
              <SelectTrigger className="w-60 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white" >
                <SelectItem value="deepgram">Deepgram</SelectItem>
                <SelectItem value="whisper">OpenAI Whisper</SelectItem>
                <SelectItem value="azure">Azure</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sttProvider === "google" && (
            <div>
              <Label>Google STT Language</Label>
              <Select value={googleLanguage} onValueChange={setGoogleLanguage}>
                <SelectTrigger className="w-60 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent  className="bg-white">
                  {GOOGLE_LANGS.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Text-to-Speech (TTS)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Provider</Label>
            <Select value={ttsProvider} onValueChange={setTtsProvider}>
              <SelectTrigger className="w-60 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent  className="bg-white">
                <SelectItem value="plivo">Plivo (built-in)</SelectItem>
                <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                <SelectItem value="azure">Azure TTS</SelectItem>
                <SelectItem value="google">Google TTS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {ttsProvider === "elevenlabs" && (
            <div className="space-y-2">
              <Label>ElevenLabs Voice IDs (optional)</Label>
              <input
                placeholder="Male voice id"
                value={elevenMale}
                onChange={(e) => setElevenMale(e.target.value)}
                className="border rounded px-2 py-1 w-full"
              />
              <input
                placeholder="Female voice id"
                value={elevenFemale}
                onChange={(e) => setElevenFemale(e.target.value)}
                className="border rounded px-2 py-1 w-full"
              />
            </div>
          )}

          {ttsProvider === "azure" && (
            <div>
              <Label>Azure Voice</Label>
              <Select
                value={azureVoiceName}
                onValueChange={setAzureVoiceName}
              >
                <SelectTrigger className="w-60 mt-1">
                  <SelectValue placeholder="Select Azure Voice" />
                </SelectTrigger>
                <SelectContent  className="bg-white">
                  {AZURE_VOICES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Curated Azure voices (English, Hindi, Marathi). More can be added later.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Button onClick={save} disabled={saving} className="bg-green-600 text-white self-center">
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </div>
  );
}

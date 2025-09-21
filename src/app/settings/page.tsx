"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [voiceGender, setVoiceGender] = useState("male");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const r = await fetch("/api/settings");
    const j = await r.json();
    setVoiceGender(j.voiceGender || "male");
  }

  async function save() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceGender }),
    });
    alert("Saved");
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-center">
          <Select value={voiceGender} onValueChange={setVoiceGender}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={save}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}

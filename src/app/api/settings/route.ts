import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  let s = await prisma.settings.findFirst();
  if (!s) s = await prisma.settings.create({ data: {} });
  return NextResponse.json(s);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  let s = await prisma.settings.findFirst();
  const data: any = {
    voiceGender: body.voiceGender ?? undefined,
    sttProvider: body.sttProvider ?? undefined,
    ttsProvider: body.ttsProvider ?? undefined,
    eleven_male_voice: body.eleven_male_voice ?? undefined,
    eleven_female_voice: body.eleven_female_voice ?? undefined
  };

  if (!s) s = await prisma.settings.create({ data });
  else s = await prisma.settings.update({ where: { id: s.id }, data });

  return NextResponse.json(s);
}

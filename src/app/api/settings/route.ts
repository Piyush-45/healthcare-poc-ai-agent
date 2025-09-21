import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  let s = await prisma.settings.findFirst();
  if (!s) s = await prisma.settings.create({ data: {} });
  return NextResponse.json(s);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  let s = await prisma.settings.findFirst();
  if (!s) s = await prisma.settings.create({ data: { voiceGender: body.voiceGender || 'male' } });
  else s = await prisma.settings.update({ where: { id: s.id }, data: { voiceGender: body.voiceGender } });
  return NextResponse.json(s);
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const patients = await prisma.patient.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const p = await prisma.patient.create({ data: { name: body.name, phone: body.phone, mrn: body.mrn } });
  return NextResponse.json(p);
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createPlivoCall } from '../../../../lib/plivo';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { patientId } = body;
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return NextResponse.json({ error: 'patient not found' }, { status: 404 });

  const call = await prisma.call.create({ data: { patientId, telephonyProvider: 'plivo', status: 'initiated' } });

  // construct answer_url so Plivo can fetch call instructions and include our internal call id if needed
  const answerUrl = `${process.env.PUBLIC_URL}/api/plivo/answer?callId=${call.id}`;

  try {
    const plivoResp = await createPlivoCall(process.env.PLIVO_FROM_NUMBER!, patient.phone, answerUrl);
    await prisma.call.update({ where: { id: call.id }, data: { telephonyCallId: plivoResp.request_uuid, status: 'ringing' } });
    return NextResponse.json({ ok: true, callId: call.id });
  } catch (err) {
    await prisma.call.update({ where: { id: call.id }, data: { status: 'failed' } });
    return NextResponse.json({ error: 'plivo error' }, { status: 500 });
  }
}

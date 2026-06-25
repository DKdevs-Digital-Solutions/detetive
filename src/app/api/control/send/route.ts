import { NextRequest, NextResponse } from 'next/server';
import { pushCommand, clientsOnline } from '@/lib/controlBus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Display ou controlador envia um comando para a sala.
export async function POST(request: NextRequest) {
  try {
    const { code, command } = await request.json();
    const room = (code || '').toString().trim().toUpperCase();
    if (!room || !command) {
      return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
    }
    const delivered = pushCommand(room, command);
    return NextResponse.json({ ok: delivered > 0, delivered });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'error' }, { status: 500 });
  }
}

// Checa quantos estão conectados na sala (display + controladores).
export async function GET(request: NextRequest) {
  const room = (new URL(request.url).searchParams.get('code') || '').trim().toUpperCase();
  return NextResponse.json({ online: room ? clientsOnline(room) : 0 });
}

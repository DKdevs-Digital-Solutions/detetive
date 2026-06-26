import { NextRequest, NextResponse } from 'next/server';
import { setPhoto, clearPhoto, hasPhoto } from '@/lib/photoStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LEN = 4_000_000; // ~4MB de data URL (limite de segurança)

// POST { code, photo } → guarda a foto da sessão. { code, clear:true } → remove.
export async function POST(request: NextRequest) {
  try {
    const { code, photo, clear } = await request.json();
    const room = (code || '').toString().trim().toUpperCase();
    if (!room) return NextResponse.json({ ok: false, error: 'missing-code' }, { status: 400 });

    if (clear) {
      clearPhoto(room);
      return NextResponse.json({ ok: true, cleared: true });
    }

    const url = (photo || '').toString();
    if (!url.startsWith('data:image/') || url.length > MAX_LEN) {
      return NextResponse.json({ ok: false, error: 'invalid-photo' }, { status: 400 });
    }
    setPhoto(room, url);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'error' }, { status: 500 });
  }
}

// GET ?code= → se já existe foto guardada para a sessão.
export async function GET(request: NextRequest) {
  const code = (new URL(request.url).searchParams.get('code') || '').trim().toUpperCase();
  return NextResponse.json({ has: code ? hasPhoto(code) : false });
}

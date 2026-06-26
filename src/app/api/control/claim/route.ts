import { NextRequest, NextResponse } from 'next/server';
import { claimRoom, releaseRoom } from '@/lib/controlBus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// O controlador reivindica/renova a posse da sessão (1 celular por sessão).
export async function POST(request: NextRequest) {
  try {
    const { code, controllerId, release } = await request.json();
    const room = (code || '').toString().trim().toUpperCase();
    const id = (controllerId || '').toString();
    if (!room || !id) return NextResponse.json({ granted: false, error: 'missing-fields' }, { status: 400 });

    if (release) {
      releaseRoom(room, id);
      return NextResponse.json({ granted: false, released: true });
    }
    return NextResponse.json(claimRoom(room, id));
  } catch (error: any) {
    return NextResponse.json({ granted: false, error: error?.message || 'error' }, { status: 500 });
  }
}

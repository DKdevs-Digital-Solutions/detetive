import { NextResponse } from 'next/server';
import { initWhatsApp, getWhatsAppStatus } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET → status atual + QR (inicia a conexão se estiver ociosa)
export async function GET() {
  const s = getWhatsAppStatus();
  if (s.status === 'idle' || s.status === 'closed') {
    initWhatsApp().catch(() => {});
  }
  return NextResponse.json(getWhatsAppStatus());
}

// POST → força (re)conexão
export async function POST() {
  initWhatsApp().catch(() => {});
  return NextResponse.json(getWhatsAppStatus());
}

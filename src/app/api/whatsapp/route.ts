import { NextResponse } from 'next/server';
import { initWhatsApp, getWhatsAppStatus, logoutWhatsApp } from '@/lib/whatsapp';

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

// DELETE → desconecta a conta atual e limpa credenciais (para parear outro número)
export async function DELETE() {
  await logoutWhatsApp();
  return NextResponse.json(getWhatsAppStatus());
}

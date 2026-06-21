import { NextRequest, NextResponse } from 'next/server';
import { buildCertificatePdf } from '@/lib/certificate';
import { sendCertificate } from '@/lib/whatsapp';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json();

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
    }

    const pdf = await buildCertificatePdf(name.trim());
    const safe =
      name
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40) || 'participante';

    const fileName = `Certificado-${safe}.pdf`;
    const caption = `Parabéns, ${name.trim()}! Aqui está o seu certificado de participação na Feira de Ciências e Tecnologias. — Colégio Monsenhor Raeder • Detetive IA`;

    const result = await sendCertificate(phone.trim(), pdf, fileName, caption);
    if (!result.ok) {
      const clientError = result.error === 'invalid-phone' || result.error === 'no-whatsapp';
      return NextResponse.json(result, { status: clientError ? 400 : 502 });
    }

    try {
      logger.logQuestion();
    } catch {
      // Estatística opcional; não deve impedir o envio.
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[certificate] error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'error' },
      { status: 500 }
    );
  }
}

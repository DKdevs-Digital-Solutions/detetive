import { NextRequest, NextResponse } from 'next/server';
import { buildCertificatePdf } from '@/lib/certificate';
import { sendCertificate } from '@/lib/whatsapp';
import { logger } from '@/lib/logger';
import { appendCertRecord, readCertRecords, toCsv } from '@/lib/certLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email } = await request.json();
    const cleanName = (name || '').toString().trim();
    if (!cleanName) {
      return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
    }

    // ── Caminho EMAIL: sem envio automático; registra no histórico para exportar. ──
    if (email && !phone) {
      const e = String(email).trim().toLowerCase();
      if (!EMAIL_RE.test(e)) {
        return NextResponse.json({ ok: false, error: 'invalid-email' }, { status: 400 });
      }
      await appendCertRecord({ name: cleanName, contact: e, channel: 'email', status: 'pendente' });
      try { logger.logQuestion(); } catch { /* estatística opcional */ }
      return NextResponse.json({ ok: true, channel: 'email' });
    }

    // ── Caminho WHATSAPP: gera o PDF e envia. ──
    if (!phone?.toString().trim()) {
      return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
    }

    const pdf = await buildCertificatePdf(cleanName);
    const safe =
      cleanName
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40) || 'participante';

    const fileName = `Certificado-${safe}.pdf`;
    const caption = `Parabéns, ${cleanName}! Aqui está o seu certificado de participação na Feira de Ciências e Tecnologias. — Colégio Monsenhor Raeder • Detetive IA`;

    const result = await sendCertificate(phone.toString().trim(), pdf, fileName, caption);
    if (!result.ok) {
      const clientError = result.error === 'invalid-phone' || result.error === 'no-whatsapp';
      return NextResponse.json(result, { status: clientError ? 400 : 502 });
    }

    await appendCertRecord({
      name: cleanName,
      contact: phone.toString().replace(/\D/g, ''),
      channel: 'whatsapp',
      status: 'enviado',
    });
    try { logger.logQuestion(); } catch { /* estatística opcional */ }

    return NextResponse.json({ ...result, channel: 'whatsapp' });
  } catch (error: any) {
    console.error('[certificate] error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'error' },
      { status: 500 }
    );
  }
}

// GET ?export=csv&key=<senha> → baixa o histórico (nome + contato) em CSV.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (url.searchParams.get('export') !== 'csv') {
    return NextResponse.json({ ok: false, error: 'bad-request' }, { status: 400 });
  }
  const key = url.searchParams.get('key') || '';
  const expected = process.env.ADMIN_PASSWORD || 'detetive2024';
  if (key !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const csv = toCsv(await readCertRecords());
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="certificados.csv"',
    },
  });
}

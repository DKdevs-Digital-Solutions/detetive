import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Gera o QR (PNG) de uma URL/texto. Reusa o pacote 'qrcode' já presente no projeto.
export async function GET(request: NextRequest) {
  const data = new URL(request.url).searchParams.get('data') || '';
  if (!data) return new Response('missing data', { status: 400 });

  try {
    const QRCode = (await import('qrcode')).default;
    const buffer: Buffer = await QRCode.toBuffer(data, {
      type: 'png',
      width: 360,
      margin: 1,
      color: { dark: '#041018', light: '#ffffff' },
    });
    return new Response(new Uint8Array(buffer), {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    return new Response(`qr-error: ${error?.message || 'error'}`, { status: 500 });
  }
}

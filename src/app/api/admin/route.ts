import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { action, password } = await request.json();
    const adminPass = process.env.ADMIN_PASSWORD || 'detetive2024';

    if (password !== adminPass) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    if (action === 'reset') {
      logger.reset();
      return NextResponse.json({ ok: true, message: 'Estatísticas resetadas' });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

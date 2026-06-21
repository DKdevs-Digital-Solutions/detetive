import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ConfidenceLevel } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, level, score } = body;

    switch (type) {
      case 'visitor':
        logger.logVisitor();
        break;
      case 'question':
        logger.logQuestion();
        break;
      case 'analysis':
        if (level) logger.logAnalysis(level as ConfidenceLevel);
        break;
      case 'quiz':
        if (typeof score === 'number') logger.logQuizScore(score);
        break;
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { classifyOffline } from '@/data/offline';
import { ConfidenceLevel } from '@/types';

const SYSTEM_PROMPT = `Você é um analisador especializado em verificação de informações e fake news. Analise o texto fornecido e retorne APENAS um JSON válido, sem texto extra.

JSON esperado:
{
  "level": "green" | "yellow" | "red",
  "riskLabel": "ALTA CONFIANÇA" | "ATENÇÃO" | "BAIXA CONFIANÇA",
  "title": "Título do diagnóstico em português (máx 60 chars)",
  "explanation": "Uma frase clara em português, com no máximo 18 palavras",
  "suspiciousPoints": ["no máximo dois pontos curtos"],
  "positivePoints": ["no máximo dois pontos curtos"],
  "recommendation": "Uma recomendação prática, com no máximo 18 palavras"
}

CRITÉRIOS DE CLASSIFICAÇÃO:
- green (ALTA CONFIANÇA): fonte clara e conhecida, data identificável, linguagem objetiva, dados verificáveis, sem sinais de manipulação
- yellow (ATENÇÃO): pode ser verdadeira mas falta fonte, data, autor ou contexto; linguagem levemente tendenciosa; dados imprecisos
- red (BAIXA CONFIANÇA): sem fonte identificável, linguagem sensacionalista/exagerada, promessas impossíveis, "estudo secreto", induz forte emoção negativa, informação claramente falsa

Seja objetivo e educativo. A parte falada inteira deve ser curta e fácil de ouvir. Sempre mencione o que verificar.`;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  let text = '';
  try {
    const body = await request.json();
    text = body.text || '';

    if (!text || text.trim().length < 5) {
      return NextResponse.json({ error: 'Texto muito curto' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      const result = classifyOffline(text);
      logger.logAnalysis(result.level);
      return NextResponse.json({ ...result, offline: true });
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 320,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analise esta informação:\n\n"${text}"`,
        },
      ],
    });

    const raw =
      response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';

    // Extract JSON from potential markdown fences
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const result = JSON.parse(jsonMatch[0]);
    logger.logAnalysis(result.level as ConfidenceLevel);

    return NextResponse.json({ ...result, offline: false });
  } catch (error) {
    console.error('[analyze] error:', error);
    const result = classifyOffline(text || '');
    logger.logAnalysis(result.level);
    return NextResponse.json({ ...result, offline: true });
  }
}

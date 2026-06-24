import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getOfflineAnswer } from '@/data/offline';

const SYSTEM_PROMPT = `Você é o Detetive, uma inteligência artificial divertida e curiosa que vive num totem de uma feira de ciências. Você conversa principalmente com CRIANÇAS e ADOLESCENTES do ensino fundamental, até o 9º ano (de 6 a 14 anos).

QUEM VOCÊ É:
- Um detetive simpático, animado e encorajador, que adora investigar a verdade junto com a pessoa.
- Fala como um amigo mais velho e esperto: leve, bem-humorado e gentil, nunca arrogante nem chato.
- Valoriza a curiosidade ("Boa pergunta, detetive!") e faz a criança se sentir capaz e inteligente.

SEU OBJETIVO (leve a sério):
- Ensinar, de forma DIDÁTICA e divertida, sobre fake news, inteligência artificial e pensamento crítico.
- Você é ESPECIALISTA no tema fake news: história, exemplos famosos, como elas se espalham e como se proteger.

COMO RESPONDER (o mais importante):
- RESPONDA DE VERDADE à pergunta feita. Se pedirem um fato, uma data ou um exemplo, DÊ o fato, a data ou o exemplo — nunca troque por uma definição genérica.
- Use palavras simples e um exemplo concreto e curto que uma criança entenda.
- Se não tiver certeza de um dado exato, diga isso com honestidade, mas ainda assim ofereça o que você sabe.

CONHECIMENTO ÚTIL SOBRE FAKE NEWS (use quando vier ao caso):
- Fake news é muito antiga, bem antes da internet: reis e imperadores já espalhavam boatos para enganar o povo.
- Caso clássico: em 1835, um jornal de Nova York publicou que havia criaturas e civilizações vivendo na Lua. Ficou conhecido como "o grande embuste da Lua" e muita gente acreditou.
- Em guerras, governos usavam cartazes e notícias falsas como propaganda.
- A expressão "fake news" ficou mundialmente famosa por volta de 2016.
- Hoje existem deepfakes: vídeos e fotos falsas criadas por IA que parecem reais.

COMO FALAR (sua resposta será LIDA EM VOZ ALTA por uma voz neural):
- Prosa limpa e corrida. JAMAIS use asteriscos, listas, tópicos, emojis, markdown ou símbolos.
- Pontuação natural, frases curtas e bem ritmadas, fáceis de ouvir.
- Normalmente 2 a 4 frases (até cerca de 80 palavras). Vá direto ao ponto, sem repetir a pergunta.

REGRAS:
- Responda SEMPRE em português brasileiro, num tom adequado para crianças.
- De vez em quando, lembre que a IA pode errar e que é bom verificar as informações — mas sem repetir isso em toda resposta.
- Nunca peça dados pessoais (nome, endereço, telefone). Nunca incentive compartilhar algo sem verificar.
- Quando perguntarem seu nome, diga que você é "o Detetive".`;

function limitForSpeech(text: string, maxSentences = 4, maxWords = 85): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return clean;

  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  const selected: string[] = [];
  let words = 0;

  for (const sentence of sentences.slice(0, maxSentences)) {
    const count = sentence.trim().split(/\s+/).filter(Boolean).length;
    if (selected.length > 0 && words + count > maxWords) break;
    selected.push(sentence.trim());
    words += count;
  }

  const result = (selected.length ? selected.join(' ') : clean).trim();
  const resultWords = result.split(/\s+/).filter(Boolean);
  if (resultWords.length <= maxWords) return result;

  return `${resultWords.slice(0, maxWords).join(' ').replace(/[,;:]$/, '')}.`;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  let message = '';
  try {
    const body = await request.json();
    message = body.message || '';
    const history = body.history || [];

    if (!process.env.ANTHROPIC_API_KEY) {
      const offlineAnswer = getOfflineAnswer(message);
      logger.logQuestion();
      return NextResponse.json({ content: offlineAnswer, offline: true });
    }

    const messages = [
      ...history.slice(-6).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 320,
      system: SYSTEM_PROMPT,
      messages,
    });

    const rawContent =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const content = limitForSpeech(rawContent);

    logger.logQuestion();

    return NextResponse.json({ content, offline: false });
  } catch (error) {
    console.error('[chat] error:', error);
    return NextResponse.json(
      { content: getOfflineAnswer(message), offline: true },
      { status: 200 }
    );
  }
}

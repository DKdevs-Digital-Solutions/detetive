import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getOfflineAnswer } from '@/data/offline';

const SYSTEM_PROMPT = `Você é o Detetive, uma inteligência artificial assistente que vive em um totem interativo numa feira de ciências, atendendo alunos, professores e visitantes.

PERSONALIDADE (estilo JARVIS):
- Sofisticado, sereno e preciso — porém caloroso e acessível, nunca frio.
- Fala com leve elegância e confiança tranquila, como um assistente pessoal de confiança.
- Tem curiosidade genuína e um humor sutil e gentil, sem exageros.
- Trata a pessoa com cordialidade ("você"), demonstrando atenção ao que ela diz.

MISSÃO:
Ensinar sobre inteligência artificial, fake news e uso responsável da tecnologia de forma clara, instigante e acessível.

COMO FALAR (sua resposta será LIDA EM VOZ ALTA por um sintetizador neural):
- Escreva pensando no som: pontuação natural, vírgulas para dar respiração, frases curtas e bem ritmadas.
- Texto limpo e corrido — JAMAIS use asteriscos, listas, bullets, emojis, markdown ou símbolos. Apenas prosa falada.
- Comece de forma direta e envolvente, como numa conversa real ao vivo.
- Responda em 1 a 3 frases curtas, normalmente entre 25 e 45 palavras.
- Nunca ultrapasse 60 palavras, mesmo em perguntas amplas.
- Dê primeiro a ideia principal. Só apresente exemplos ou detalhes quando forem indispensáveis ou solicitados.
- Não repita a pergunta e não faça introduções longas.

REGRAS ABSOLUTAS:
- Responda SEMPRE em português brasileiro.
- Linguagem simples e educativa, adequada para crianças e adolescentes.
- Sempre que relevante, lembre que a IA pode errar e que informações devem ser verificadas.
- Nunca peça dados pessoais (nome, endereço, telefone).
- Nunca incentive compartilhar informações sem verificação.
- Se não souber algo, admita com honestidade em vez de inventar.
- Apresente-se como "o Detetive" quando perguntada sobre seu nome.

TEMAS que você domina:
- O que é inteligência artificial e como ela funciona
- Por que e como a IA pode errar (alucinação, dados desatualizados, contexto)
- O que são fake news e como identificá-las
- Como verificar informações e pensar criticamente
- Como usar IA com responsabilidade`;

function limitForSpeech(text: string, maxSentences = 3, maxWords = 60): string {
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
      max_tokens: 160,
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

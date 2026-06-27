import { AI_JUDGE_POOL, judgeCasePrompt, judgeRevealLine, AIERR_INTRO } from './aiErrors';
import { NEWS_POOL, newsCasePrompt } from './news';
import { CHECKLIST_ITEMS, CHECKLIST_INTRO, CHECKLIST_CLOSING } from './checklist';
import { QUIZ_QUESTIONS } from './quiz';

// Frases de parabéns ditas na celebração entre fases (fixas → pré-gravadas).
export const PRAISE = [
  'Muito bem! Você conquistou um selo. Vamos para a próxima fase.',
  'Boa! Mais um selo na sua jornada de detetive. Seguindo!',
  'Mandou bem! Selo conquistado. Vamos continuar a investigação.',
];

// Feedback curto de acerto/erro (reaproveitado em notícias, IA-erros e quiz).
export const FB_RIGHT = 'Boa, detetive!';
export const FB_WRONG = 'Quase! Olha só.';

// Falas FIXAS da conversa (as respostas da IA continuam ao vivo — são dinâmicas).
export const CONV_GREETING =
  'Última missão, detetive! Agora é a sua vez de interrogar a inteligência artificial. Faça até três perguntas sobre IA ou fake news. Pode mandar a primeira.';
export const CONV_CLOSING =
  'Caso encerrado, detetive! Foi uma honra investigar com você. Vou preparar o seu certificado.';
export const CONV_TIMEOUT =
  'Sem mais perguntas, detetive? Então vamos direto ao seu certificado!';

export interface Clip {
  id: string;
  text: string;
}

/**
 * Todos os áudios FIXOS (repetidos a cada visitante). São pré-gravados em MP3
 * por `scripts/gen-audio.mjs` e tocados de `public/audio/<id>.mp3`, evitando o
 * custo da ElevenLabs ao vivo. A voz neural ao vivo fica SÓ para as respostas
 * dinâmicas da conversa livre.
 *
 * IDs usam o `id` estável do item do pool — não o índice da sessão — para que
 * o MP3 correto seja tocado independentemente de qual subconjunto foi sorteado.
 */
export const CLIPS: Clip[] = [
  ...PRAISE.map((text, i) => ({ id: `praise-${i}`, text })),
  { id: 'fb-right', text: FB_RIGHT },
  { id: 'fb-wrong', text: FB_WRONG },

  // A IA acertou ou errou? — intro + leitura de cada caso + revelação.
  { id: 'aierr-intro', text: AIERR_INTRO },
  ...AI_JUDGE_POOL.map((c) => ({ id: `judge-case-${c.id}`, text: judgeCasePrompt(c) })),
  ...AI_JUDGE_POOL.map((c) => ({ id: `judge-reveal-${c.id}`, text: judgeRevealLine(c) })),

  // Investigue a notícia — leitura do caso + explicação após veredito.
  ...NEWS_POOL.map((l) => ({ id: `news-case-${l.id}`, text: newsCasePrompt(l) })),
  ...NEWS_POOL.map((l) => ({ id: `news-${l.id}`, text: l.speech })),

  // Prova de detetive (quiz) — pergunta + explicação, por id estável.
  ...QUIZ_QUESTIONS.map((q) => ({ id: `quiz-q-${q.id}`, text: q.question })),
  ...QUIZ_QUESTIONS.map((q) => ({ id: `quiz-exp-${q.id}`, text: q.explanation })),

  // Conversa (linhas fixas).
  { id: 'conv-greeting', text: CONV_GREETING },
  { id: 'conv-closing', text: CONV_CLOSING },
  { id: 'conv-timeout', text: CONV_TIMEOUT },

  // Checklist do detetive (narrado).
  { id: 'checklist-intro', text: CHECKLIST_INTRO },
  ...CHECKLIST_ITEMS.map((it, i) => ({ id: `checklist-${i}`, text: `${it.question} ${it.detail}` })),
  { id: 'checklist-closing', text: CHECKLIST_CLOSING },
];

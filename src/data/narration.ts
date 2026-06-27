import { AI_JUDGE_CASES, judgeCasePrompt, judgeRevealLine } from './aiErrors';
import { NEWS_LESSONS, newsCasePrompt } from './news';
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
 */
export const CLIPS: Clip[] = [
  ...PRAISE.map((text, i) => ({ id: `praise-${i}`, text })),
  { id: 'fb-right', text: FB_RIGHT },
  { id: 'fb-wrong', text: FB_WRONG },

  // Investigue a notícia (interativo): leitura do caso + revelação (explicação).
  ...NEWS_LESSONS.map((l, i) => ({ id: `news-case-${i}`, text: newsCasePrompt(l, i) })),
  ...NEWS_LESSONS.map((l, i) => ({ id: `news-${i}`, text: l.speech })),

  // A IA acertou ou errou? (interativo): leitura do caso + revelação.
  ...AI_JUDGE_CASES.map((c, i) => ({ id: `judge-case-${i}`, text: judgeCasePrompt(c, i) })),
  ...AI_JUDGE_CASES.map((c, i) => ({ id: `judge-reveal-${i}`, text: judgeRevealLine(c) })),

  // Prova de detetive (quiz): pergunta + explicação, por id estável da pergunta.
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

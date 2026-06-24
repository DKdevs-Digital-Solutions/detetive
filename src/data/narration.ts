import { AI_ERROR_EXAMPLES, AIERR_INTRO, AIERR_CLOSING, aiErrLine } from './aiErrors';
import { NEWS_LESSONS, NEWS_INTRO, NEWS_CLOSING } from './news';
import { CHECKLIST_ITEMS, CHECKLIST_INTRO, CHECKLIST_CLOSING } from './checklist';

// Frases de parabéns ditas na celebração entre fases (fixas → pré-gravadas).
export const PRAISE = [
  'Muito bem! Você conquistou um selo. Vamos para a próxima fase.',
  'Boa! Mais um selo na sua jornada de detetive. Seguindo!',
  'Mandou bem! Selo conquistado. Vamos continuar a investigação.',
];

export interface Clip {
  id: string;
  text: string;
}

/**
 * Todos os áudios FIXOS (repetidos a cada visitante). São pré-gravados em MP3
 * por `scripts/gen-audio.mjs` e tocados de `public/audio/<id>.mp3`, evitando o
 * custo da ElevenLabs ao vivo. A voz neural ao vivo fica só para o quiz e para
 * a conversa livre (respostas dinâmicas).
 */
export const CLIPS: Clip[] = [
  ...PRAISE.map((text, i) => ({ id: `praise-${i}`, text })),

  { id: 'aierr-intro', text: AIERR_INTRO },
  ...AI_ERROR_EXAMPLES.map((ex, i) => ({ id: `aierr-${i}`, text: aiErrLine(ex) })),
  { id: 'aierr-closing', text: AIERR_CLOSING },

  { id: 'news-intro', text: NEWS_INTRO },
  ...NEWS_LESSONS.map((l, i) => ({ id: `news-${i}`, text: l.speech })),
  { id: 'news-closing', text: NEWS_CLOSING },

  { id: 'checklist-intro', text: CHECKLIST_INTRO },
  ...CHECKLIST_ITEMS.map((it, i) => ({ id: `checklist-${i}`, text: `${it.question} ${it.detail}` })),
  { id: 'checklist-closing', text: CHECKLIST_CLOSING },
];

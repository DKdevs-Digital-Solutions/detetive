import { BadgeId, Screen } from '@/types';

export interface BadgeMeta {
  id: BadgeId;
  label: string;   // descrição completa
  short: string;   // rótulo curto (selo)
  screen: Screen;  // atividade que concede o selo
  color: string;
}

// A jornada: 5 selos, um por atividade. Ao coletar todos → certificado.
export const BADGES: BadgeMeta[] = [
  { id: 'assistant', label: 'Conversou com o Detetive', short: 'Conversa',    screen: 'assistant', color: '#00d4ff' },
  { id: 'news',      label: 'Analisou uma notícia',      short: 'Notícia',     screen: 'news',      color: '#0088ff' },
  { id: 'quiz',      label: 'Completou o quiz',          short: 'Quiz',        screen: 'quiz',      color: '#9966ff' },
  { id: 'checklist', label: 'Concluiu o checklist',      short: 'Checklist',   screen: 'checklist', color: '#00dd66' },
  { id: 'ai-errors', label: 'Explorou os erros da IA',   short: 'Erros da IA', screen: 'ai-errors', color: '#ffaa00' },
];

export const BADGE_IDS: BadgeId[] = BADGES.map((b) => b.id);

export function emptyBadges(): Record<BadgeId, boolean> {
  return BADGE_IDS.reduce((acc, id) => ({ ...acc, [id]: false }), {} as Record<BadgeId, boolean>);
}

// ─── Jornada linear (fase → fase → certificado) ────────────────────────────────
// Ordem pedagógica: entender que a IA falha → aplicar → reforçar → testar →
// conversar. A última fase é a conversa por voz; ao concluí-la, vai ao certificado.
export const JOURNEY: Screen[] = ['ai-errors', 'news', 'checklist', 'quiz', 'assistant'];

export const PHASE_LABELS: Record<string, string> = {
  'ai-errors': 'Pegue o erro da IA',
  news: 'Investigue a notícia',
  checklist: 'Checklist do detetive',
  quiz: 'Prova de detetive',
  assistant: 'Interrogue a IA',
};

export function journeyIndex(screen: Screen): number {
  return JOURNEY.indexOf(screen);
}

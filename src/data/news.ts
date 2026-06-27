import { ConfidenceLevel } from '@/types';

export interface NewsLesson {
  id: number;
  headline: string;
  level: ConfidenceLevel;
  verdict: string;
  clues: string[];
  speech: string;
}

// Texto lido pelo narrador (sem número de caso — posição varia por sessão).
export const newsCasePrompt = (l: NewsLesson): string =>
  `${l.headline}. O que você acha: confiável, atenção, ou suspeita?`;

export const NEWS_INTRO =
  'Toda notícia deixa pistas, como num caso de detetive. Eu uso um semáforo da confiança: verde é confiável, amarelo pede atenção, e vermelho é perigo. Vou te mostrar três exemplos. Preste atenção nas pistas.';
export const NEWS_CLOSING =
  'Pegou o jeito? Sempre confira a fonte, a data, e desconfie de títulos exagerados. Na dúvida, não compartilhe. Quando terminar de ler, toque em continuar.';

// ─── Pool completo ────────────────────────────────────────────────────────────
// A sessão escolhe 1 de cada nível (vermelho, amarelo, verde) para garantir
// variedade a cada visitante sem repetir sempre os mesmos casos.

const NEWS_RED: NewsLesson[] = [
  {
    id: 1,
    headline: 'URGENTE: Cientistas descobrem fruta que cura TODAS as doenças. Médicos estão chocados!',
    level: 'red',
    verdict: 'Sinal vermelho — provável fake news',
    clues: [
      'Palavras exageradas: URGENTE, cura TODAS, chocados',
      'Promessa milagrosa, boa demais para ser verdade',
      'Nenhuma fonte ou estudo citado',
    ],
    speech:
      'Esta manchete grita urgente, cura todas as doenças, médicos chocados. Percebe o exagero? Palavras de choque, promessa impossível e nenhuma fonte. Sinal vermelho, quase certeza de fake news.',
  },
  {
    id: 4,
    headline: 'INCRÍVEL: Médico revela segredo que elimina diabetes em 7 dias. Farmácias odeiam isso!',
    level: 'red',
    verdict: 'Sinal vermelho — fake news clássica',
    clues: [
      '"Farmácias odeiam" — linguagem de conspiração',
      'Promessa impossível: cura em 7 dias',
      'Nenhum médico real ou estudo citado',
    ],
    speech:
      'Um médico revelou um segredo que elimina a diabetes em sete dias, e as farmácias odeiam isso. Três sinais de alerta: promessa impossível, linguagem de conspiração, e nenhuma prova. Clássico de fake news.',
  },
  {
    id: 7,
    headline: 'URGENTE: WhatsApp vai cobrar mensalmente a partir de hoje. Pague ou perca sua conta!',
    level: 'red',
    verdict: 'Sinal vermelho — golpe recorrente',
    clues: [
      'Urgência falsa: "a partir de hoje"',
      'Ameaça de perda ("perca sua conta")',
      'Esse boato circula há anos sem ser verdade',
    ],
    speech:
      'O WhatsApp vai cobrar hoje e você vai perder a conta se não pagar. Urgência falsa, ameaça e uma informação que circula há anos sem nunca ter sido verdade. Sinal vermelho.',
  },
];

const NEWS_YELLOW: NewsLesson[] = [
  {
    id: 2,
    headline: 'Estudo afirma que ficar acordado até tarde faz mal para a memória.',
    level: 'yellow',
    verdict: 'Sinal amarelo — precisa verificar',
    clues: [
      'Até pode ser verdade, mas...',
      'Qual estudo? Quem fez? Em que ano?',
      'Sem fonte clara para a gente conferir',
    ],
    speech:
      'Um estudo afirma que ficar acordado até tarde faz mal para a memória. Pode até ser verdade, mas qual estudo é esse? Quem fez? Quando? Faltam informações para confirmar. Amarelo: pesquise mais antes de acreditar.',
  },
  {
    id: 5,
    headline: 'Especialistas dizem que usar celular antes de dormir prejudica o sono.',
    level: 'yellow',
    verdict: 'Sinal amarelo — pode ser real, mas faltam dados',
    clues: [
      'Quais especialistas? De onde?',
      'Há pesquisas sobre luz azul e sono, mas a manchete não cita nenhuma',
      'Verifique antes de acreditar',
    ],
    speech:
      'Especialistas dizem que o celular antes de dormir prejudica o sono. Isso pode ser verdade, existem estudos sobre luz azul. Mas quais especialistas? Sem fonte, é amarelo: pode ser real, mas verifique.',
  },
  {
    id: 8,
    headline: 'Pesquisa sugere que quem lê mais tem melhor desempenho escolar.',
    level: 'yellow',
    verdict: 'Sinal amarelo — plausível, mas sem fonte',
    clues: [
      'Qual pesquisa? Onde foi publicada?',
      'A afirmação é razoável, mas sem detalhes para conferir',
      'Sempre busque o estudo original',
    ],
    speech:
      'Esta sugere que quem lê mais vai melhor na escola. É plausível, mas sem dizer qual pesquisa ou onde foi publicada, não dá para confirmar. Amarelo: parece sensato, mas verifique a fonte.',
  },
];

const NEWS_GREEN: NewsLesson[] = [
  {
    id: 3,
    headline: 'Segundo a Fiocruz, em 2024, a vacinação reduziu os casos de sarampo no Brasil.',
    level: 'green',
    verdict: 'Sinal verde — boa cara de confiável',
    clues: [
      'Fonte confiável citada: Fiocruz',
      'Tem data: 2024',
      'Linguagem calma e equilibrada, sem exageros',
    ],
    speech:
      'Segundo a Fiocruz, em 2024, a vacinação reduziu os casos de sarampo no Brasil. Fonte confiável, data citada, linguagem tranquila. Isso é sinal verde. Mesmo assim, sempre vale conferir o relatório original.',
  },
  {
    id: 6,
    headline: 'Ministério da Saúde confirma redução de 32% nos casos de dengue no Brasil em 2024.',
    level: 'green',
    verdict: 'Sinal verde — boa cara de confiável',
    clues: [
      'Fonte oficial: Ministério da Saúde',
      'Dado específico (32%) com ano (2024)',
      'Linguagem técnica e neutra, sem exagero',
    ],
    speech:
      'Ministério da Saúde confirma redução de 32% nos casos de dengue em 2024. Fonte oficial, número específico, linguagem neutra. Sinal verde. Vale buscar o boletim original para confirmar o dado.',
  },
  {
    id: 9,
    headline: 'IBGE: número de jovens matriculados no ensino superior cresceu 8% em 2023.',
    level: 'green',
    verdict: 'Sinal verde — parece confiável',
    clues: [
      'IBGE é fonte oficial de estatísticas do Brasil',
      'Dado específico com ano',
      'Formato típico de relatório técnico',
    ],
    speech:
      'IBGE aponta crescimento de 8% de jovens no ensino superior em 2023. IBGE é fonte oficial de dados do Brasil. Número preciso, ano citado, formato técnico. Sinal verde. Sempre vale confirmar diretamente no site do IBGE.',
  },
];

// Pool completo ordenado por id — importado por narration.ts para gerar todos os MP3.
export const NEWS_POOL: NewsLesson[] = [...NEWS_RED, ...NEWS_YELLOW, ...NEWS_GREEN].sort(
  (a, b) => a.id - b.id
);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sorteia 1 caso de cada nível → garante sempre ver os 3 semáforos, mas em
// combinações diferentes a cada sessão.
export function pickNewsCases(n = 3): NewsLesson[] {
  const red = shuffle(NEWS_RED)[0];
  const yellow = shuffle(NEWS_YELLOW)[0];
  const green = shuffle(NEWS_GREEN)[0];
  return shuffle([red, yellow, green]).slice(0, n);
}

// Alias mantido para compatibilidade com narration.ts (usa o pool inteiro para gerar clips).
export const NEWS_LESSONS = NEWS_POOL;

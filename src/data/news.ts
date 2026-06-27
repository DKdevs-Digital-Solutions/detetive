import { ConfidenceLevel } from '@/types';

export interface NewsLesson {
  headline: string;
  level: ConfidenceLevel;
  verdict: string;
  clues: string[];
  speech: string;
}

// Leitura do caso (texto FIXO → pré-gravável). Usado na tela E no gerador de áudio.
export const newsCasePrompt = (l: NewsLesson, i: number): string =>
  `Caso ${i + 1}. ${l.headline}. O que você acha: confiável, atenção, ou suspeita?`;

export const NEWS_INTRO =
  'Toda notícia deixa pistas, como num caso de detetive. Eu uso um semáforo da confiança: verde é confiável, amarelo pede atenção, e vermelho é perigo. Vou te mostrar três exemplos. Preste atenção nas pistas.';
export const NEWS_CLOSING =
  'Pegou o jeito? Sempre confira a fonte, a data, e desconfie de títulos exagerados. Na dúvida, não compartilhe. Quando terminar de ler, toque em continuar.';

export const NEWS_LESSONS: NewsLesson[] = [
  {
    headline: 'URGENTE: Cientistas descobrem fruta que cura TODAS as doenças. Médicos estão chocados!',
    level: 'red',
    verdict: 'Sinal vermelho — provável fake news',
    clues: [
      'Palavras exageradas: URGENTE, cura TODAS, chocados',
      'Promessa milagrosa, boa demais para ser verdade',
      'Nenhuma fonte ou estudo citado',
    ],
    speech:
      'Olha esta manchete: cientistas descobrem uma fruta que cura todas as doenças, e os médicos estão chocados. Percebe o exagero? Palavras como urgente e cura tudo, uma promessa boa demais, e nenhuma fonte. Isso é sinal vermelho, quase certeza de fake news.',
  },
  {
    headline: 'Estudo afirma que ficar acordado até tarde faz mal para a memória.',
    level: 'yellow',
    verdict: 'Sinal amarelo — precisa verificar',
    clues: [
      'Até pode ser verdade, mas...',
      'Qual estudo? Quem fez? Em que ano?',
      'Sem fonte clara para a gente conferir',
    ],
    speech:
      'Agora esta: um estudo afirma que ficar acordado até tarde faz mal para a memória. Pode até ser verdade, mas qual estudo é esse? Quem fez? Quando? Faltam informações para confirmar. Isso é sinal amarelo: pesquise mais antes de acreditar.',
  },
  {
    headline: 'Segundo a Fiocruz, em 2024, a vacinação reduziu os casos de sarampo no Brasil.',
    level: 'green',
    verdict: 'Sinal verde — boa cara de confiável',
    clues: [
      'Fonte confiável citada: Fiocruz',
      'Tem data: 2024',
      'Linguagem calma e equilibrada, sem exageros',
    ],
    speech:
      'E esta: segundo a Fiocruz, em 2024, a vacinação reduziu os casos de sarampo no Brasil. Aqui temos uma fonte confiável, uma data, e linguagem tranquila, sem exageros. Isso é sinal verde, com boa cara de confiável. Mesmo assim, sempre vale conferir.',
  },
];

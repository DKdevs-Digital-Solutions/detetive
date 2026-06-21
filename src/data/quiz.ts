import { QuizQuestion } from '@/types';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'A Inteligência Artificial sempre fala a verdade?',
    options: ['Sim, ela é infalível', 'Não, ela pode errar', 'Só erra em matemática'],
    correct: 1,
    explanation:
      'A IA pode gerar respostas erradas, incompletas ou desatualizadas. Por isso, sempre verifique as informações com fontes confiáveis!',
  },
  {
    id: 2,
    question: 'O que são "fake news"?',
    options: [
      'Notícias sobre tecnologia',
      'Notícias apenas em inglês',
      'Informações falsas ou distorcidas espalhadas como se fossem verdadeiras',
    ],
    correct: 2,
    explanation:
      'Fake news são informações falsas, exageradas ou manipuladas, espalhadas como se fossem verdadeiras. Podem causar pânico, preconceito e danos à sociedade.',
  },
  {
    id: 3,
    question: 'Uma notícia sem fonte confiável deve ser compartilhada?',
    options: ['Sim, se parecer verdadeira', 'Não, deve ser verificada primeiro', 'Depende do tema'],
    correct: 1,
    explanation:
      'Nunca compartilhe informações sem verificar a fonte. Compartilhar fake news, mesmo sem querer, ajuda a espalhar desinformação.',
  },
  {
    id: 4,
    question: 'Qual é uma boa prática ao usar IA para estudar?',
    options: [
      'Copiar tudo sem ler',
      'Conferir, entender e comparar as informações',
      'Usar a IA como única fonte',
    ],
    correct: 1,
    explanation:
      'A IA é uma ferramenta de apoio, não a dona da verdade. Sempre leia, entenda e compare as respostas com outras fontes confiáveis.',
  },
  {
    id: 5,
    question: 'Por que a IA pode errar?',
    options: [
      'Porque ela é preguiçosa',
      'Por dados incompletos, contexto insuficiente ou informações desatualizadas',
      'Porque os programadores não gostam dela',
    ],
    correct: 1,
    explanation:
      'A IA aprende com dados. Se os dados têm erros, são incompletos ou antigos, a IA pode gerar respostas incorretas ou imprecisas.',
  },
  {
    id: 6,
    question: 'O que deve ser feito antes de acreditar em uma notícia chocante?',
    options: [
      'Compartilhar imediatamente com amigos',
      'Verificar a fonte, a data e comparar com outros sites',
      'Acreditar se o título for convincente',
    ],
    correct: 1,
    explanation:
      'Notícias que causam forte emoção (medo, raiva, urgência) são frequentemente usadas para espalhar desinformação. Sempre verifique antes de acreditar ou compartilhar.',
  },
  {
    id: 7,
    question: 'Se a IA responde algo, isso significa que é verdade?',
    options: ['Sim, sempre', 'Não, a resposta deve ser verificada', 'Só se vier de uma IA famosa'],
    correct: 1,
    explanation:
      'A IA pode gerar respostas que parecem muito convincentes, mas que são incorretas. Esse fenômeno é chamado de "alucinação" da IA.',
  },
  {
    id: 8,
    question: 'Qual desses é um sinal de alerta para fake news?',
    options: [
      'A notícia tem data e autor identificado',
      'O título usa palavras exageradas como "CHOQUE" ou "INCRÍVEL"',
      'A notícia cita estudos científicos',
    ],
    correct: 1,
    explanation:
      'Títulos exagerados, sensacionalistas ou que geram medo/euforia são característicos de fake news. Desconfie sempre dessas notícias.',
  },
  {
    id: 9,
    question: 'É correto usar IA para fazer trabalhos escolares?',
    options: [
      'Sim, pode copiar tudo sem entender',
      'Sim, mas precisa entender, verificar e não copiar sem aprender',
      'Não, nunca use IA para estudar',
    ],
    correct: 1,
    explanation:
      'A IA pode ajudar a organizar ideias e tirar dúvidas, mas é essencial entender o conteúdo, verificar as informações e não apenas copiar sem aprendizado.',
  },
  {
    id: 10,
    question: 'Qual é a principal lição do Detetive IA?',
    options: [
      'A IA substitui completamente o pensamento humano',
      'A tecnologia e o pensamento crítico devem caminhar juntos',
      'Toda informação na internet é confiável',
    ],
    correct: 1,
    explanation:
      'A tecnologia pode ajudar a investigar a verdade, mas a responsabilidade de pensar, verificar e decidir continua sendo humana!',
  },
];

export interface AIErrorExample {
  id: number;
  category: string;
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  explanation: string;
  color: string;
}

export const AI_ERROR_EXAMPLES: AIErrorExample[] = [
  {
    id: 1,
    category: 'Alucinação',
    question: 'Quais são os livros escritos por [autor fictício]?',
    wrongAnswer:
      '"Sombras do Amanhã" (2018), "O Último Código" (2020) e "Memórias Digitais" (2022). São obras muito aclamadas pela crítica.',
    correctAnswer:
      'Esse autor não existe. A IA inventou títulos de livros com detalhes convincentes — datas, títulos, elogios — mas tudo é falso.',
    explanation:
      'A IA pode "alucinar": criar informações inexistentes de forma muito convincente. Isso é perigoso porque a resposta parece verdadeira.',
    color: '#ff3344',
  },
  {
    id: 2,
    category: 'Informação desatualizada',
    question: 'Quem é o presidente do Brasil?',
    wrongAnswer:
      'Responde com um nome desatualizado, pois a IA tem uma "data de corte" e não conhece eventos recentes após esse ponto.',
    correctAnswer:
      'A IA pode não ter informações sobre o presidente atual se ele foi eleito após sua data de treinamento.',
    explanation:
      'Modelos de IA são treinados com dados até uma certa data. Eventos que aconteceram depois disso são desconhecidos para ela.',
    color: '#ffaa00',
  },
  {
    id: 3,
    category: 'Contexto insuficiente',
    question: '"Banco" é perigoso?',
    wrongAnswer:
      '"Banco pode ser perigoso em situações de risco financeiro, mas também pode ser estável dependendo de suas garantias..."',
    correctAnswer:
      'Sem contexto, a IA não sabe se você fala de banco financeiro, banco de praça ou banco de dados. A resposta pode ser completamente equivocada.',
    explanation:
      'Quando uma pergunta pode ter mais de um significado, a IA fica confusa. Ela escolhe um significado e responde com confiança, mesmo que seja o errado.',
    color: '#ffaa00',
  },
  {
    id: 4,
    category: 'Preconceito nos dados',
    question: 'Quem é melhor para trabalhar com computadores?',
    wrongAnswer:
      'Responde dando preferência a um grupo de pessoas, repetindo preconceitos que estavam nas informações com que ela aprendeu.',
    correctAnswer:
      'Qualquer pessoa, seja menino ou menina, de qualquer cor ou lugar, pode ser ótima com computadores. A IA às vezes repete preconceitos antigos.',
    explanation:
      'Se a IA aprende com informações cheias de preconceito, ela acaba repetindo esse preconceito. Por isso é preciso sempre pensar com a própria cabeça.',
    color: '#ff3344',
  },
  {
    id: 5,
    category: 'Fonte inexistente',
    question: 'Cite um estudo científico sobre o tema X.',
    wrongAnswer:
      '"Segundo o estudo de Silva et al. (2021), publicado na Revista Brasileira de Ciências, p. 45-67..."',
    correctAnswer:
      'Esse artigo pode não existir. A IA pode inventar autores, títulos, revistas e números de página com aparência completamente realista.',
    explanation:
      'Nunca use referências bibliográficas geradas pela IA sem verificar se elas realmente existem. A consequência pode ser um trabalho acadêmico com fontes falsas.',
    color: '#ff3344',
  },
];

// ─── Casos do jogo "A IA acertou ou errou?" (o visitante julga pelo celular) ───
// Mistura respostas CERTAS e ERRADAS para o visitante precisar pensar — não basta
// dizer "errou" sempre.
export interface AIJudgeCase {
  id: number;
  question: string;   // o que perguntaram à IA
  answer: string;     // o que a IA respondeu
  aiCorrect: boolean; // a IA acertou?
  tag: string;        // rótulo (tipo de erro, ou "Resposta correta")
  explanation: string;
  color: string;
}

export const AI_JUDGE_CASES: AIJudgeCase[] = [
  {
    id: 1,
    question: 'Quais livros o autor Joaquim Veraldo escreveu?',
    answer: '"Sombras do Amanhã" (2018) e "O Último Código" (2020), obras muito elogiadas pela crítica.',
    aiCorrect: false,
    tag: 'Alucinação',
    explanation: 'Esse autor não existe! A IA inventou títulos e datas com cara de verdade. Isso se chama "alucinação".',
    color: '#ff3344',
  },
  {
    id: 2,
    question: 'Qual é a capital do Japão?',
    answer: 'A capital do Japão é Tóquio.',
    aiCorrect: true,
    tag: 'Resposta correta',
    explanation: 'Fato consolidado e fácil de conferir — aqui a IA acerta. Mesmo assim, no que é importante, sempre confirme.',
    color: '#00dd44',
  },
  {
    id: 3,
    question: 'Cite um estudo científico sobre o sono dos adolescentes.',
    answer: 'Segundo Silva et al. (2021), na Revista Brasileira de Ciências, p. 45-67...',
    aiCorrect: false,
    tag: 'Fonte inexistente',
    explanation: 'A IA pode inventar autores, revistas e páginas que parecem reais. Nunca use uma fonte sem verificar se ela existe.',
    color: '#ff3344',
  },
  {
    id: 4,
    question: 'Me dá uma dica para estudar melhor para a prova?',
    answer: 'Divida a matéria em partes, revise um pouco todo dia e faça resumos com as suas próprias palavras.',
    aiCorrect: true,
    tag: 'Resposta correta',
    explanation: 'Conselho geral e sensato — neste tipo de orientação a IA costuma ajudar bem.',
    color: '#00dd44',
  },
  {
    id: 5,
    question: 'Quem é melhor para trabalhar com computadores?',
    answer: 'Geralmente os meninos se dão melhor com computadores.',
    aiCorrect: false,
    tag: 'Preconceito nos dados',
    explanation: 'Errado! Qualquer pessoa pode ser ótima com computadores. A IA às vezes repete preconceitos que estavam nos dados de treino.',
    color: '#ffaa00',
  },
];

// ─── Narração fixa (pré-gravável em MP3) ───────────────────────────────────────
export const AIERR_INTRO =
  'Você sabia que a inteligência artificial pode errar? Vou te mostrar alguns tipos de erro que ela comete. Preste atenção em cada um.';
export const AIERR_CLOSING =
  'Viu só? A IA ajuda muito, mas não substitui o pensamento humano. Sempre verifique, compare e reflita. Quando estiver pronto, toque em continuar.';

export const aiErrLine = (ex: AIErrorExample): string =>
  `${ex.category}. Imagine perguntar à inteligência artificial: ${ex.question} Ela pode responder com muita confiança, mas errado, como você vê aí na tela. O certo é: ${ex.correctAnswer} Isso acontece porque ${ex.explanation}`;

export interface AIErrorExample {
  id: number;
  category: string;
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  explanation: string;
  color: string;
}

// ─── Pool "A IA acertou ou errou?" ───────────────────────────────────────────
// Sessão sorteia 5 casos garantindo 2 respostas corretas e 3 erradas,
// para que o visitante não caia no vício de responder "errou" sempre.

export interface AIJudgeCase {
  id: number;
  question: string;
  answer: string;
  aiCorrect: boolean;
  tag: string;
  explanation: string;
  color: string;
}

// Casos em que a IA ERROU
const AI_WRONG: AIJudgeCase[] = [
  {
    id: 1,
    question: 'Quais livros o autor Joaquim Veraldo escreveu?',
    answer: '"Sombras do Amanhã" (2018) e "O Último Código" (2020), obras muito elogiadas pela crítica.',
    aiCorrect: false,
    tag: 'Alucinação',
    explanation: 'Esse autor não existe! A IA inventou títulos e datas com cara de verdade. Isso se chama alucinação.',
    color: '#ff3344',
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
    id: 5,
    question: 'Quem é melhor para trabalhar com computadores?',
    answer: 'Geralmente os meninos se dão melhor com computadores.',
    aiCorrect: false,
    tag: 'Preconceito nos dados',
    explanation: 'Errado! Qualquer pessoa pode ser ótima com computadores. A IA às vezes repete preconceitos que estavam nos dados de treino.',
    color: '#ffaa00',
  },
  {
    id: 7,
    question: 'Qual é o celular mais barato disponível para comprar hoje?',
    answer: 'O celular mais acessível disponível hoje é o JioPhone Next, por cerca de R$ 200.',
    aiCorrect: false,
    tag: 'Informação desatualizada',
    explanation: 'Preços e modelos mudam o tempo todo. A IA não sabe o que foi lançado depois do treinamento dela — a resposta pode estar desatualizada.',
    color: '#ffaa00',
  },
  {
    id: 9,
    question: 'Qual o telefone de emergência do hospital mais perto de mim?',
    answer: 'O telefone do hospital mais próximo é (11) 3456-7890, funcionando 24 horas.',
    aiCorrect: false,
    tag: 'Alucinação',
    explanation: 'A IA não sabe onde você está! Ela inventou um número que parece real mas provavelmente não existe. Para informações locais, use o Google Maps.',
    color: '#ff3344',
  },
  {
    id: 10,
    question: 'Crie uma referência bibliográfica de um livro sobre fake news para o meu trabalho escolar.',
    answer: 'SANTOS, Maria Clara. Fake News na Era Digital. São Paulo: Editora Conhecimento, 2022.',
    aiCorrect: false,
    tag: 'Fonte inexistente',
    explanation: 'Esse livro provavelmente não existe. A IA monta referências com aparência perfeita, mas os dados podem ser inventados. Sempre verifique antes de usar no trabalho.',
    color: '#ff3344',
  },
];

// Casos em que a IA ACERTOU
const AI_RIGHT: AIJudgeCase[] = [
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
    id: 4,
    question: 'Me dá uma dica para estudar melhor para a prova.',
    answer: 'Divida a matéria em partes, revise um pouco todo dia e faça resumos com as suas próprias palavras.',
    aiCorrect: true,
    tag: 'Resposta correta',
    explanation: 'Conselho geral e sensato — neste tipo de orientação a IA costuma ajudar bem.',
    color: '#00dd44',
  },
  {
    id: 6,
    question: 'Quanto é 15% de 200?',
    answer: '15% de 200 é igual a 30.',
    aiCorrect: true,
    tag: 'Resposta correta',
    explanation: 'Cálculo simples e verificável — aqui a IA acertou. Para contas básicas ela vai bem, mas em problemas complexos sempre confira.',
    color: '#00dd44',
  },
  {
    id: 8,
    question: 'Você consegue descrever a Torre Eiffel?',
    answer: 'A Torre Eiffel é uma estrutura de ferro forjado em Paris, construída entre 1887 e 1889 para a Exposição Universal.',
    aiCorrect: true,
    tag: 'Resposta correta',
    explanation: 'Informação histórica bem documentada — a IA acerta bem em fatos amplamente registrados. Para esse tipo de pergunta, ela é confiável.',
    color: '#00dd44',
  },
];

// Pool completo ordenado por id — importado por narration.ts para gerar todos os MPs.
export const AI_JUDGE_POOL: AIJudgeCase[] = [...AI_WRONG, ...AI_RIGHT].sort((a, b) => a.id - b.id);

// Alias para compatibilidade com código anterior.
export const AI_JUDGE_CASES = AI_JUDGE_POOL;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sorteia 5 casos: sempre 2 corretos + 3 errados — o visitante não pode chutar
// "errou" em todos e acertar; precisa realmente pensar.
export function pickAIJudgeCases(n = 5): AIJudgeCase[] {
  const nRight = Math.min(2, AI_RIGHT.length);
  const nWrong = Math.min(n - nRight, AI_WRONG.length);
  return shuffle([...shuffle(AI_RIGHT).slice(0, nRight), ...shuffle(AI_WRONG).slice(0, nWrong)]);
}

// Texto lido pelo narrador (sem número de caso — posição varia por sessão).
export const judgeCasePrompt = (c: AIJudgeCase): string =>
  `Perguntaram à inteligência artificial: ${c.question} E ela respondeu: ${c.answer}. A IA acertou ou errou?`;

export const judgeRevealLine = (c: AIJudgeCase): string =>
  `A IA ${c.aiCorrect ? 'acertou' : 'errou'}. ${c.explanation}`;

// ─── Narração fixa da fase ────────────────────────────────────────────────────
export const AIERR_INTRO =
  'Você sabia que a inteligência artificial pode errar? Vou te mostrar situações reais. Em cada uma, você vai dizer se a IA acertou ou errou a resposta. Atenção!';
export const AIERR_CLOSING =
  'Viu só? A IA ajuda muito, mas não substitui o pensamento humano. Sempre verifique, compare e reflita. Continue pelo celular.';

// Legado — não mais usado nas telas novas.
export const AI_ERROR_EXAMPLES: AIErrorExample[] = [];
export const aiErrLine = (_ex: AIErrorExample): string => '';

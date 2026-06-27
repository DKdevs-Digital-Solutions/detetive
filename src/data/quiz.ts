import { QuizQuestion } from '@/types';

// Pool com 20 perguntas — linguagem acessível para alunos até o 9º ano do
// Ensino Fundamental. A sessão sorteia 5 em ordem aleatória.

const QUIZ_POOL: QuizQuestion[] = [
  {
    id: 1,
    question: 'A Inteligência Artificial sempre fala a verdade?',
    options: ['Sim, ela nunca erra', 'Não, ela pode errar e inventar coisas', 'Só erra em matemática'],
    correct: 1,
    explanation:
      'A IA pode criar respostas erradas ou inventadas — isso se chama "alucinação". Por isso, sempre verifique as informações em outras fontes!',
  },
  {
    id: 2,
    question: 'O que são fake news?',
    options: [
      'Notícias só em inglês',
      'Informações falsas espalhadas como se fossem verdadeiras',
      'Notícias sobre tecnologia',
    ],
    correct: 1,
    explanation:
      'Fake news são informações falsas ou exageradas espalhadas como se fossem verdade. Podem causar medo, preconceito e confusão nas pessoas.',
  },
  {
    id: 3,
    question: 'Você recebeu uma notícia incrível no WhatsApp. O que deve fazer primeiro?',
    options: [
      'Compartilhar logo para todo mundo saber',
      'Verificar a fonte antes de acreditar ou compartilhar',
      'Acreditar se vier de um amigo',
    ],
    correct: 1,
    explanation:
      'Sempre verifique antes de compartilhar. Mesmo que venha de alguém de confiança, essa pessoa também pode ter sido enganada.',
  },
  {
    id: 4,
    question: 'Qual dessas manchetes parece suspeita?',
    options: [
      'IBGE divulga resultado do censo 2022',
      'CHOCANTE: Fruta CURA câncer e médicos querem esconder isso!!!',
      'Ministério da Saúde lança campanha de vacinação',
    ],
    correct: 1,
    explanation:
      'Palavras em maiúsculas, muitas exclamações e promessas impossíveis são sinais de fake news. Sempre desconfie de títulos que tentam te assustar ou empolgar demais.',
  },
  {
    id: 5,
    question: 'Por que a IA pode dar uma resposta desatualizada?',
    options: [
      'Porque ela é preguiçosa',
      'Porque ela só aprendeu até uma data e não sabe o que aconteceu depois',
      'Porque ela não gosta de atualizar',
    ],
    correct: 1,
    explanation:
      'A IA aprende com dados até uma certa data (chamada "data de corte"). Eventos que aconteceram depois disso ela simplesmente não conhece.',
  },
  {
    id: 6,
    question: 'Uma notícia com mais de mil compartilhamentos é confiável?',
    options: [
      'Sim, muita gente não pode se enganar',
      'Não, fake news se espalham rápido porque causam emoção forte',
      'Depende do número exato',
    ],
    correct: 1,
    explanation:
      'Fake news costumam se espalhar muito rápido justamente porque causam medo, raiva ou euforia. Popularidade não é prova de verdade.',
  },
  {
    id: 7,
    question: 'O que a IA faz quando não sabe uma resposta?',
    options: [
      'Ela fala "não sei" sempre',
      'Às vezes ela inventa uma resposta que parece real',
      'Ela desliga sozinha',
    ],
    correct: 1,
    explanation:
      'A IA pode gerar respostas convincentes mesmo quando não tem certeza. Por isso é importante verificar o que ela diz, especialmente em assuntos sérios.',
  },
  {
    id: 8,
    question: 'Onde você pode verificar se uma notícia é falsa?',
    options: [
      'Perguntando para amigos',
      'Em sites de checagem como Agência Lupa e Aos Fatos',
      'Contando o número de curtidas',
    ],
    correct: 1,
    explanation:
      'Existem agências especializadas em checar notícias, como Agência Lupa, Aos Fatos e Boatos.org. Elas investigam e mostram se a informação é verdadeira ou falsa.',
  },
  {
    id: 9,
    question: 'Você pode copiar a resposta da IA direto para o seu trabalho escolar?',
    options: [
      'Sim, ela sempre está certa',
      'Não — precisa ler, entender, verificar e escrever com suas palavras',
      'Sim, se citar a IA como fonte',
    ],
    correct: 1,
    explanation:
      'Copiar sem entender não é aprendizado, e a IA pode estar errada. Use-a como ponto de partida, mas sempre verifique e reescreva com suas próprias palavras.',
  },
  {
    id: 10,
    question: 'O que é uma "alucinação" de IA?',
    options: [
      'Quando a IA fica lenta',
      'Quando a IA inventa informações que parecem verdadeiras, mas são falsas',
      'Quando a IA repete a mesma resposta',
    ],
    correct: 1,
    explanation:
      'Alucinação é quando a IA cria fatos, nomes, datas ou fontes que não existem, mas escreve como se fossem reais. É um dos maiores riscos no uso de IA.',
  },
  {
    id: 11,
    question: 'Qual dessas é uma fonte confiável para pesquisar sobre saúde?',
    options: [
      'Um vídeo no TikTok de uma pessoa famosa',
      'O site oficial do Ministério da Saúde ou da Fiocruz',
      'Uma mensagem de WhatsApp com muitas estrelas',
    ],
    correct: 1,
    explanation:
      'Fontes oficiais como Ministério da Saúde, Fiocruz e OMS têm equipes de especialistas. Influenciadores e mensagens de WhatsApp não têm essa garantia.',
  },
  {
    id: 12,
    question: 'O que significa "verificar a fonte" de uma notícia?',
    options: [
      'Ver quantas pessoas curtiram',
      'Descobrir quem publicou e se essa pessoa ou site é confiável',
      'Traduzir para outro idioma',
    ],
    correct: 1,
    explanation:
      'Verificar a fonte é descobrir de onde veio a informação: qual jornal, qual site, qual pesquisador. Se a fonte for desconhecida ou suspeita, a notícia também é suspeita.',
  },
  {
    id: 13,
    question: 'A IA pode ter preconceito?',
    options: [
      'Não, máquinas são sempre imparciais',
      'Sim, se aprendeu com textos que tinham preconceito, ela repete isso',
      'Só se o programador quiser',
    ],
    correct: 1,
    explanation:
      'A IA aprende com textos escritos por humanos. Se esses textos têm preconceito, ela pode reproduzir esse preconceito — sem perceber e sem querer.',
  },
  {
    id: 14,
    question: 'Um título em LETRAS MAIÚSCULAS com muitas exclamações!!!',
    options: [
      'É sinal de que a notícia é importante e verdadeira',
      'É uma técnica para te fazer clicar sem pensar',
      'Significa que o computador travou',
    ],
    correct: 1,
    explanation:
      'Títulos gritados tentam ativar suas emoções (medo, raiva, surpresa) para você reagir antes de pensar. Isso é uma estratégia clássica de fake news.',
  },
  {
    id: 15,
    question: 'Se a IA diz que um remédio cura uma doença, você deve...',
    options: [
      'Tomar o remédio na mesma hora',
      'Consultar um médico e não confiar só na IA para assuntos de saúde',
      'Compartilhar a dica com todos',
    ],
    correct: 1,
    explanation:
      'Para assuntos de saúde, a IA pode estar errada ou desatualizada. Sempre consulte um médico ou profissional de saúde antes de qualquer decisão.',
  },
  {
    id: 16,
    question: 'O que acontece quando você compartilha uma fake news sem querer?',
    options: [
      'Nada, não é culpa sua',
      'Você ajuda a espalhar a mentira, mesmo sem intenção',
      'A internet remove sozinha',
    ],
    correct: 1,
    explanation:
      'Cada compartilhamento faz a fake news chegar a mais pessoas. Mesmo sem querer, quem compartilha também é responsável pela desinformação.',
  },
  {
    id: 17,
    question: 'O que é o "pensamento crítico"?',
    options: [
      'Criticar tudo que você lê',
      'Questionar, verificar e analisar antes de acreditar em algo',
      'Só acreditar no que os professores falam',
    ],
    correct: 1,
    explanation:
      'Pensamento crítico é a habilidade de não aceitar tudo automaticamente: perguntar "quem disse isso?", "tem prova?", "faz sentido?" antes de acreditar.',
  },
  {
    id: 18,
    question: 'Qual é a principal diferença entre a IA e um ser humano ao tomar decisões?',
    options: [
      'A IA é sempre mais rápida e mais correta',
      'O ser humano pode usar ética, contexto e bom senso; a IA segue padrões dos dados',
      'Não há diferença, elas funcionam igual',
    ],
    correct: 1,
    explanation:
      'A IA identifica padrões em dados, mas não entende contexto emocional, ética ou valores humanos. Decisões importantes devem sempre passar pelo julgamento humano.',
  },
  {
    id: 19,
    question: 'Por que é importante checar a data de uma notícia?',
    options: [
      'Para saber o dia da semana',
      'Porque uma informação antiga pode não ser mais verdadeira hoje',
      'Não é importante, informação não tem data',
    ],
    correct: 1,
    explanation:
      'Muitas fake news são notícias antigas reaproveitadas fora de contexto. Uma informação de 2015 pode ser completamente diferente da situação atual.',
  },
  {
    id: 20,
    question: 'Qual é a lição mais importante do Detetive IA?',
    options: [
      'Não usar tecnologia nunca',
      'Usar a tecnologia com curiosidade, mas sempre verificar e pensar por conta própria',
      'Confiar em tudo que a IA diz',
    ],
    correct: 1,
    explanation:
      'A tecnologia é uma ferramenta poderosa, mas a responsabilidade de pensar, questionar e decidir sempre é sua. Seja um detetive da informação!',
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sorteia 5 perguntas do pool de 20 e embaralha as opções de cada uma.
export function pickQuizQuestions(n = 5): QuizQuestion[] {
  return shuffle(QUIZ_POOL)
    .slice(0, Math.min(n, QUIZ_POOL.length))
    .map((q) => {
      const tagged = q.options.map((text, i) => ({ text, correct: i === q.correct }));
      const mixed = shuffle(tagged);
      return { ...q, options: mixed.map((o) => o.text), correct: mixed.findIndex((o) => o.correct) };
    });
}

// Exporta o pool completo para narration.ts gerar todos os MP3.
export const QUIZ_QUESTIONS = QUIZ_POOL;

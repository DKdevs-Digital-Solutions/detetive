export interface OfflineEntry {
  keywords: string[];
  answer: string;
}

export const OFFLINE_QA: OfflineEntry[] = [
  {
    keywords: ['ia pode errar', 'você erra', 'sempre certa', 'infalível'],
    answer:
      'Sim, eu posso errar! Sou uma inteligência artificial e gero respostas baseadas em padrões, não em conhecimento real. Posso apresentar informações erradas com muita confiança — isso se chama "alucinação". Por isso, sempre verifique minhas respostas com fontes confiáveis.',
  },
  {
    keywords: ['o que é ia', 'o que é inteligência artificial', 'como funciona a ia'],
    answer:
      'Inteligência Artificial é uma tecnologia que permite máquinas aprenderem e tomarem decisões analisando grandes quantidades de dados. Ela está presente em assistentes de voz, redes sociais, tradutores e muito mais. Quanto mais dados, mais ela aprende — mas isso não a torna perfeita!',
  },
  {
    keywords: ['fake news', 'notícia falsa', 'desinformação', 'mentira'],
    answer:
      'Fake news são informações falsas ou distorcidas espalhadas como se fossem verdadeiras. Para identificá-las: verifique a fonte, veja se tem data e autor, procure a notícia em outros sites confiáveis, e observe se o título tenta causar medo, raiva ou urgência.',
  },
  {
    keywords: ['uso responsável', 'usar ia', 'trabalho escolar', 'escola'],
    answer:
      'Você pode usar IA para estudar, tirar dúvidas e organizar ideias! Mas é importante: entender o conteúdo (não só copiar), verificar as informações geradas, declarar quando usar IA em trabalhos, e lembrar que a decisão final é sempre sua.',
  },
  {
    keywords: ['verificar', 'checar', 'como saber', 'confirmar'],
    answer:
      'Para verificar uma informação: 1) Verifique a fonte — ela é conhecida e confiável? 2) A notícia tem data e autor? 3) O título parece exagerado? 4) A informação aparece em outros sites confiáveis? 5) A notícia tenta causar medo ou urgência? Se houver dúvida, não compartilhe!',
  },
  {
    keywords: ['semáforo', 'verde', 'amarelo', 'vermelho', 'confiança'],
    answer:
      'O semáforo de confiança indica: VERDE = informação parece consistente e tem fonte clara. AMARELO = informação precisa de mais verificação (falta fonte, data ou contexto). VERMELHO = informação parece falsa, exagerada ou manipulada. Sempre fique atento ao vermelho!',
  },
  {
    keywords: ['quiz', 'perguntas', 'teste'],
    answer:
      'O quiz do Detetive IA tem 10 perguntas sobre IA, fake news e uso responsável da tecnologia. Você pode acessá-lo pelo menu principal. Ao final, receberá uma pontuação e uma mensagem educativa!',
  },
  {
    keywords: ['checklist', 'lista', 'dicas'],
    answer:
      'O checklist do Detetive IA tem 10 perguntas para ajudar você a verificar qualquer informação. Acesse pelo menu principal e use-o sempre que encontrar uma notícia suspeita!',
  },
  {
    keywords: ['gesto', 'mão', 'câmera', 'webcam'],
    answer:
      'Você pode controlar o Detetive IA com gestos! Mão aberta = pausar. Joinha para cima = marcar como confiável. Joinha para baixo = marcar como suspeito. Dedo apontando = mais detalhes. Movimento circular = repetir resposta.',
  },
  {
    keywords: ['oi', 'olá', 'hey', 'bom dia', 'boa tarde', 'boa noite', 'hello'],
    answer:
      'Olá! Eu sou o Detetive IA, seu assistente para investigar a verdade! Posso ajudar você a: entender o que é inteligência artificial, verificar se uma notícia parece confiável, aprender sobre fake news, e usar a IA com responsabilidade. Como posso te ajudar hoje?',
  },
];

export const OFFLINE_NEWS_CLASSIFIER = {
  redKeywords: [
    'estudo secreto',
    'médicos odeiam',
    'incrível milagre',
    'choque',
    'você não vai acreditar',
    'descubra agora',
    'proibido',
    'eles não querem que você saiba',
    'cura milagrosa',
    'elimina em dias',
    'segredo revelado',
    '100% comprovado',
    'governo esconde',
  ],
  yellowKeywords: [
    'estudo mostra',
    'pesquisadores afirmam',
    'dados preliminares',
    'segundo fontes',
    'pode ser',
    'especialistas dizem',
    'alguns acreditam',
    'relatos indicam',
  ],
};

export function classifyOffline(text: string): {
  level: 'green' | 'yellow' | 'red';
  riskLabel: string;
  title: string;
  explanation: string;
  suspiciousPoints: string[];
  positivePoints: string[];
  recommendation: string;
} {
  const lower = text.toLowerCase();

  const redMatches = OFFLINE_NEWS_CLASSIFIER.redKeywords.filter((k) =>
    lower.includes(k)
  );
  const yellowMatches = OFFLINE_NEWS_CLASSIFIER.yellowKeywords.filter((k) =>
    lower.includes(k)
  );

  const hasSource = /fonte:|segundo o|de acordo com|publicado|portal|jornal/i.test(text);
  const hasDate = /\d{2}\/\d{2}\/\d{4}|\d{4}|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i.test(text);
  const isShort = text.trim().split(' ').length < 10;

  if (redMatches.length > 0) {
    return {
      level: 'red',
      riskLabel: 'BAIXA CONFIANÇA',
      title: 'Alerta — Informação suspeita',
      explanation:
        'Esta informação apresenta características típicas de fake news: linguagem sensacionalista, promessas exageradas ou ausência de fonte verificável.',
      suspiciousPoints: [
        'Linguagem exagerada ou sensacionalista detectada',
        'Ausência de fonte identificável',
        ...(!hasDate ? ['Sem data de publicação'] : []),
        ...redMatches.slice(0, 2).map((k) => `Termo suspeito: "${k}"`),
      ],
      positivePoints: [...(hasSource ? ['Menciona uma fonte'] : [])],
      recommendation:
        'Não compartilhe essa informação. Busque o tema em sites confiáveis como portais de fato-checagem, institutos de pesquisa ou veículos jornalísticos reconhecidos.',
    };
  }

  if (!hasSource || !hasDate || isShort || yellowMatches.length > 0) {
    return {
      level: 'yellow',
      riskLabel: 'ATENÇÃO',
      title: 'Atenção — Verificação necessária',
      explanation:
        'A informação pode ser verdadeira, mas faltam elementos essenciais para confirmar sua confiabilidade.',
      suspiciousPoints: [
        ...(!hasSource ? ['Fonte não identificada claramente'] : []),
        ...(!hasDate ? ['Data de publicação não encontrada'] : []),
        ...(isShort ? ['Texto muito curto, contexto insuficiente'] : []),
      ],
      positivePoints: [
        ...(hasSource ? ['Menciona uma fonte'] : []),
        ...(hasDate ? ['Contém referência de data'] : []),
      ],
      recommendation:
        'Procure a informação em pelo menos 3 fontes diferentes e confiáveis antes de acreditar ou compartilhar.',
    };
  }

  return {
    level: 'green',
    riskLabel: 'ALTA CONFIANÇA',
    title: 'Informação parece consistente',
    explanation:
      'A informação apresenta características positivas: fonte identificável, data presente e linguagem equilibrada.',
    suspiciousPoints: [],
    positivePoints: [
      'Fonte identificada no texto',
      'Contém data de publicação',
      'Linguagem objetiva',
    ],
    recommendation:
      'Mesmo com indicadores positivos, confirme a informação com outras fontes confiáveis antes de compartilhar.',
  };
}

export function getOfflineAnswer(question: string): string {
  const lower = question.toLowerCase();
  for (const entry of OFFLINE_QA) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      return entry.answer;
    }
  }
  return 'Estou em modo offline no momento. Posso te dizer que a inteligência artificial pode errar, que fake news são informações falsas espalhadas como verdadeiras, e que o uso responsável da IA exige verificar as informações geradas. Tente novamente quando a conexão estiver disponível!';
}

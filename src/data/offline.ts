export interface OfflineEntry {
  keywords: string[];
  answer: string;
}

export const OFFLINE_QA: OfflineEntry[] = [
  {
    keywords: ['ia pode errar', 'você erra', 'sempre certa', 'infalível'],
    answer:
      'Sim, eu posso errar. Às vezes gero informações convincentes, mas incorretas. Por isso, confirme respostas importantes em fontes confiáveis.',
  },
  {
    keywords: ['o que é ia', 'o que é inteligência artificial', 'como funciona a ia'],
    answer:
      'Inteligência artificial identifica padrões em dados para gerar respostas ou tomar decisões. Ela ajuda em muitas tarefas, mas não entende tudo e pode errar.',
  },
  {
    keywords: ['fake news', 'notícia falsa', 'desinformação', 'mentira'],
    answer:
      'Fake news são informações falsas ou distorcidas apresentadas como verdade. Confira fonte, data e autor, e compare a notícia com veículos confiáveis antes de compartilhar.',
  },
  {
    keywords: ['uso responsável', 'usar ia', 'trabalho escolar', 'escola'],
    answer:
      'Use a IA para estudar e organizar ideias, não apenas para copiar. Verifique o conteúdo e informe quando ela foi usada em um trabalho.',
  },
  {
    keywords: ['verificar', 'checar', 'como saber', 'confirmar'],
    answer:
      'Confira a fonte, a data, o autor e o tom do título. Depois compare com outros sites confiáveis. Na dúvida, não compartilhe.',
  },
  {
    keywords: ['semáforo', 'verde', 'amarelo', 'vermelho', 'confiança'],
    answer:
      'Verde indica bons sinais de confiança. Amarelo pede mais verificação. Vermelho aponta sinais fortes de informação falsa ou manipulada.',
  },
  {
    keywords: ['quiz', 'perguntas', 'teste'],
    answer:
      'O quiz tem 10 perguntas sobre IA, fake news e uso responsável. Abra pelo menu principal e teste seus conhecimentos.',
  },
  {
    keywords: ['checklist', 'lista', 'dicas'],
    answer:
      'O checklist reúne 10 perguntas para verificar notícias. Use-o sempre que encontrar uma informação suspeita.',
  },
  {
    keywords: ['gesto', 'mão', 'câmera', 'webcam'],
    answer:
      'Você pode usar gestos: mão aberta pausa, joinha avalia, dedo apontado pede detalhes e movimento circular repete a resposta.',
  },
  {
    keywords: ['oi', 'olá', 'hey', 'bom dia', 'boa tarde', 'boa noite', 'hello'],
    answer:
      'Olá! Eu sou o Detetive IA. Posso explicar inteligência artificial, investigar notícias e ensinar como evitar fake news. O que você quer descobrir?',
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
  return 'Estou offline agora. Ainda posso explicar que a IA pode errar e ajudar você a reconhecer fake news. Faça uma pergunta sobre esses temas.';
}

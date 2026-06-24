export interface ChecklistItem {
  id: number;
  question: string;
  detail: string;
}

export const CHECKLIST_INTRO =
  'Vou te ensinar a desconfiar de notícias falsas. Preste atenção em cada ponto que eu vou marcar.';
export const CHECKLIST_CLOSING =
  'Pronto! Quanto mais respostas sim, mais confiável é a notícia. Na dúvida, não compartilhe.';

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 1, question: 'Quem publicou essa informação?', detail: 'A fonte é um veículo conhecido, instituto de pesquisa ou órgão oficial?' },
  { id: 2, question: 'Existe uma fonte confiável citada?', detail: 'A notícia cita a origem dos dados? Dá para verificar?' },
  { id: 3, question: 'A notícia tem data de publicação?', detail: 'Notícias antigas podem ser recompartilhadas fora de contexto.' },
  { id: 4, question: 'O autor é identificado?', detail: 'Há um jornalista ou especialista responsável pelo conteúdo?' },
  { id: 5, question: 'O título parece exagerado?', detail: 'Títulos como CHOQUE, INCRÍVEL ou SEGREDO REVELADO são sinais de alerta.' },
  { id: 6, question: 'A informação aparece em outros sites confiáveis?', detail: 'Pesquise a notícia em pelo menos três fontes diferentes e conhecidas.' },
  { id: 7, question: 'A imagem pode estar fora de contexto?', detail: 'Fotos de eventos antigos são frequentemente usadas em notícias falsas.' },
  { id: 8, question: 'A notícia tenta causar medo, raiva ou urgência?', detail: 'Emoções fortes são usadas para impedir o pensamento crítico.' },
  { id: 9, question: 'A informação apresenta dados ou apenas opinião?', detail: 'Dados verificáveis tornam a informação mais confiável.' },
  { id: 10, question: 'A IA explicou de onde veio a resposta?', detail: 'IAs devem indicar a origem de suas informações. Se não o fizer, desconfie.' },
];

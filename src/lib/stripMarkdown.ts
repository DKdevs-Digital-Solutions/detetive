// Remove markdown e emojis de texto antes de enviar ao TTS
export function stripMarkdown(text: string): string {
  return (
    text
      // Bold e italic: **texto** *texto* __texto__ _texto_
      .replace(/\*{1,3}([\s\S]*?)\*{1,3}/g, '$1')
      .replace(/_{1,3}([\s\S]*?)_{1,3}/g, '$1')
      // Code blocks e inline code
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      // Headers: # ## ###
      .replace(/^#{1,6}\s+/gm, '')
      // Links: [texto](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Imagens: ![alt](url)
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      // Bullets: - * • +
      .replace(/^[\s]*[-*+•]\s+/gm, '')
      // Numbered lists: 1. 2.
      .replace(/^\s*\d+\.\s+/gm, '')
      // Blockquotes: >
      .replace(/^>\s*/gm, '')
      // Horizontal rules: ---
      .replace(/^[-_*]{3,}\s*$/gm, '')
      // Emojis (vários ranges Unicode)
      .replace(
        /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F0FF}\u{1F680}-\u{1F6FF}\u{FE00}-\u{FE0F}]/gu,
        ''
      )
      // Caracteres especiais de markup: | (tabelas)
      .replace(/\|/g, ', ')
      // Duplas quebras de linha → pausa natural (ponto)
      .replace(/\n{2,}/g, '. ')
      // Quebras simples → espaço
      .replace(/\n/g, ' ')
      // Espaços duplos
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

// Divide texto em sentenças para TTS mais natural
export function splitIntoSentences(text: string): string[] {
  const cleaned = stripMarkdown(text);
  // Divide em sentenças respeitando abreviações comuns
  const sentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚ])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return sentences.length > 0 ? sentences : [cleaned];
}

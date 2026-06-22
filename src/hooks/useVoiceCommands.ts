'use client';

import { useEffect, useRef } from 'react';
import { Screen } from '@/types';

const COMMAND_MAP: Array<{ words: string[]; screen: Screen }> = [
  { words: ['conversar', 'assistente', 'detetive', 'chat', 'pergunt', 'falar', 'convers'], screen: 'assistant' },
  { words: ['notícia', 'noticia', 'noticias', 'analisar', 'análise', 'analise', 'news'], screen: 'news' },
  { words: ['quiz', 'teste', 'jogo', 'perguntas'], screen: 'quiz' },
  { words: ['checklist', 'lista', 'verificar', 'verificação', 'verificacao', 'check'], screen: 'checklist' },
  { words: ['erro', 'errar', 'falha', 'problema', 'erros', 'ia pode'], screen: 'ai-errors' },
  { words: ['voltar', 'início', 'inicio', 'menu', 'principal', 'casa', 'home'], screen: 'home' },
];

// Reconhece comandos de voz em qualquer tela (exceto assistente, que gerencia
// sua própria recognition). Chama onCommand com a tela destino e o texto ouvido
// para que o chamador possa exibir o overlay de transição.
export function useVoiceCommands(
  onCommand: (screen: Screen, recognizedText: string) => void,
  enabled: boolean
) {
  const recRef      = useRef<any>(null);
  const enabledRef  = useRef(enabled);
  const stoppedRef  = useRef(false);
  const speechBusyRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const onSpeechStart = () => {
      speechBusyRef.current = true;
      try { recRef.current?.abort(); } catch {}
    };
    const onSpeechEnd = () => {
      speechBusyRef.current = false;
    };
    window.addEventListener('detetive:speech-start', onSpeechStart);
    window.addEventListener('detetive:speech-end', onSpeechEnd);
    return () => {
      window.removeEventListener('detetive:speech-start', onSpeechStart);
      window.removeEventListener('detetive:speech-end', onSpeechEnd);
    };
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    stoppedRef.current = false;

    const start = () => {
      if (stoppedRef.current || !enabledRef.current || speechBusyRef.current) return;

      const rec = new SR();
      rec.lang = 'pt-BR';
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 2;

      // Gramática de comandos para melhorar precisão
      const GL = (window as any).SpeechGrammarList ?? (window as any).webkitSpeechGrammarList;
      if (GL) {
        const gl = new GL();
        const words = COMMAND_MAP.flatMap((c) => c.words).join(' | ');
        gl.addFromString(`#JSGF V1.0; grammar commands; public <command> = ${words} ;`, 1);
        rec.grammars = gl;
      }

      rec.onresult = (event: any) => {
        if (!enabledRef.current || speechBusyRef.current) return;
        // Usa o resultado de maior confiança
        const result = event.results[0];
        let text = '';
        let best = -1;
        for (let j = 0; j < result.length; j++) {
          if (result[j].confidence > best) {
            best = result[j].confidence;
            text = result[j].transcript.toLowerCase().trim();
          }
        }
        for (const { words, screen } of COMMAND_MAP) {
          if (words.some((w) => text.includes(w))) {
            onCommand(screen, text);
            return;
          }
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') return;
        setTimeout(() => start(), 900);
      };

      rec.onend = () => {
        if (!stoppedRef.current && enabledRef.current && !speechBusyRef.current) {
          setTimeout(() => start(), 400);
        }
      };

      recRef.current = rec;
      try { rec.start(); } catch {}
    };

    // Delay para evitar conflito com a recognition da tela anterior
    const t = setTimeout(() => start(), 700);

    return () => {
      stoppedRef.current = true;
      clearTimeout(t);
      try { recRef.current?.abort(); } catch {}
      recRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}

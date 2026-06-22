'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { stripMarkdown } from '@/lib/stripMarkdown';

// ─── Pré-processamento ────────────────────────────────────────────────────────

function preprocessText(text: string): string {
  return stripMarkdown(text)
    .replace(/\n+/g, '. ')   // quebras de linha viram pausa de frase
    .replace(/\s{2,}/g, ' ') // normaliza espaços
    .replace(/\.{2,}/g, '.')  // reticências → ponto simples
    .trim();
}

// Separa em sentenças COMPLETAS — nunca quebra em vírgula.
// O TTS engine lida melhor com sentenças inteiras (prosódia + entonação).
function splitIntoSentences(text: string): string[] {
  const clean = preprocessText(text);
  if (!clean) return [];

  // Divide apenas onde há .!? SEGUIDO de espaço + letra maiúscula
  // Isso preserva abreviações (Dr., Prof., R$1.000 etc.)
  const parts = clean
    .replace(/([.!?])\s+(?=[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ])/g, '$1|||')
    .split('|||')
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  return parts.length ? parts : [clean];
}

// ─── Escolha de voz ───────────────────────────────────────────────────────────

const MALE_PATTERN   = /daniel|antonio|antônio|henrique|carlos|jorge|pedro|francisco|ricardo|renato|male/i;
const FEMALE_PATTERN = /maria|francisca|ana\b|inês|ines|vitoria|vitória|fernanda|camila|julia|júlia|female/i;

function pickMaleVoice(): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis.getVoices();
  const pt  = all.filter((v) => /^pt/i.test(v.lang));
  const ptBR = pt.filter((v) => /pt.?BR/i.test(v.lang));

  const isMale    = (v: SpeechSynthesisVoice) =>  MALE_PATTERN.test(v.name);
  const notFemale = (v: SpeechSynthesisVoice) => !FEMALE_PATTERN.test(v.name);

  const choice =
    ptBR.find(isMale) ||
    pt.find(isMale)   ||
    ptBR.find(notFemale) ||
    pt.find(notFemale)   ||
    ptBR[0] || pt[0] || null;

  return choice ?? null;
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTalking,  setIsTalking]  = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const activeRef  = useRef(false);
  const pauseRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const globallySpeakingRef = useRef(false);
  const speechIdRef = useRef(`native-speech-${Math.random().toString(36).slice(2)}`);

  const announceSpeaking = useCallback((active: boolean) => {
    if (typeof window === 'undefined' || globallySpeakingRef.current === active) return;
    globallySpeakingRef.current = active;
    window.dispatchEvent(new CustomEvent(active ? 'detetive:speech-start' : 'detetive:speech-end', {
      detail: { id: speechIdRef.current },
    }));
    if (active) window.dispatchEvent(new Event('detetive:keepalive'));
  }, []);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const clearPause = () => {
    if (pauseRef.current) { clearTimeout(pauseRef.current); pauseRef.current = null; }
  };

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!isSupported) { announceSpeaking(false); onEnd?.(); return; }

      clearPause();
      window.speechSynthesis.cancel();
      activeRef.current = true;

      const sentences = splitIntoSentences(text);
      setIsSpeaking(true);
      setIsTalking(false);
      announceSpeaking(true);

      const run = () => {
        if (!activeRef.current) return;
        const voice = pickMaleVoice();

        const speakAt = (idx: number) => {
          if (!activeRef.current || idx >= sentences.length) {
            setIsSpeaking(false);
            setIsTalking(false);
            activeRef.current = false;
            announceSpeaking(false);
            onEnd?.();
            return;
          }

          const sentence = sentences[idx];
          const u = new SpeechSynthesisUtterance(sentence);
          u.lang   = 'pt-BR';
          u.rate   = 0.87;
          u.pitch  = 0.78;  // bem grave — voz masculina
          u.volume = 1;
          if (voice) u.voice = voice;

          // Pausa entre sentenças varia por pontuação final
          const lastChar = sentence.trimEnd().slice(-1);
          const interSentencePause =
            lastChar === '!' ? 260 :
            lastChar === '?' ? 300 : 280;

          u.onstart = () => {
            if (activeRef.current) setIsTalking(true);
          };

          u.onend = () => {
            if (!activeRef.current) return;
            setIsTalking(false); // boca fecha entre sentenças
            clearPause();
            pauseRef.current = setTimeout(() => {
              if (activeRef.current) speakAt(idx + 1);
            }, interSentencePause);
          };

          u.onerror = () => {
            setIsTalking(false);
            setIsSpeaking(false);
            activeRef.current = false;
            announceSpeaking(false);
            onEnd?.();
          };

          window.speechSynthesis.speak(u);
        };

        speakAt(0);
      };

      // Aguarda vozes carregarem se necessário
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', run, { once: true });
      } else {
        run();
      }
    },
    [isSupported, announceSpeaking]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    activeRef.current = false;
    clearPause();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsTalking(false);
    announceSpeaking(false);
  }, [isSupported, announceSpeaking]);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      clearPause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      announceSpeaking(false);
    };
  }, [announceSpeaking]);

  return { speak, stop, isSpeaking, isTalking, isSupported };
}

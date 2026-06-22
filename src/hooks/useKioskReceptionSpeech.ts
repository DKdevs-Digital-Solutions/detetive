'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MotionValue, useMotionValue } from 'framer-motion';
import { PresenceEventType } from '@/hooks/usePresenceDetection';

const ENGAGED_LINES = [
  'Ei, você! Topa investigar uma notícia comigo? Toque na tela e participe do desafio Detetive IA.',
  'Olá, investigador! Pare um instante e descubra se você consegue identificar uma fake news. Toque na tela para começar.',
  'Tenho um desafio para você! Será que a inteligência artificial pode errar? Toque na tela e venha investigar.',
];

const MALE_PATTERN = /daniel|antonio|antônio|henrique|carlos|jorge|pedro|francisco|ricardo|renato|male/i;
const FEMALE_PATTERN = /maria|francisca|ana\b|inês|ines|vitoria|vitória|fernanda|camila|julia|júlia|female/i;

function choosePortugueseVoice(): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis.getVoices();
  const pt = all.filter((voice) => /^pt/i.test(voice.lang));
  const ptBR = pt.filter((voice) => /pt.?BR/i.test(voice.lang));
  const isMale = (voice: SpeechSynthesisVoice) => MALE_PATTERN.test(voice.name);
  const notFemale = (voice: SpeechSynthesisVoice) => !FEMALE_PATTERN.test(voice.name);

  return (
    ptBR.find(isMale) ||
    pt.find(isMale) ||
    ptBR.find(notFemale) ||
    pt.find(notFemale) ||
    ptBR[0] ||
    pt[0] ||
    null
  );
}

/**
 * Voz da recepção executada 100% no navegador.
 *
 * A fala é usada somente quando alguém permanece diante do totem. Quem
 * apenas passa recebe uma saudação visual. As frases são fixas e rotativas:
 * não chama Claude, OpenAI, ElevenLabs ou qualquer API paga.
 */
export function useKioskReceptionSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeType, setActiveType] = useState<PresenceEventType | null>(null);
  const amplitude = useMotionValue(0);

  const busyRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animationRef = useRef<number | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineIndexRef = useRef(0);
  const speechIdRef = useRef(`reception-local-${Math.random().toString(36).slice(2)}`);
  const announcedRef = useRef(false);

  const announce = useCallback((active: boolean) => {
    if (typeof window === 'undefined' || announcedRef.current === active) return;
    announcedRef.current = active;
    window.dispatchEvent(
      new CustomEvent(active ? 'detetive:speech-start' : 'detetive:speech-end', {
        detail: { id: speechIdRef.current },
      })
    );
    if (active) window.dispatchEvent(new Event('detetive:keepalive'));
  }, []);

  const stopAmplitude = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    amplitude.set(0);
  }, [amplitude]);

  const startAmplitude = useCallback(() => {
    let phase = 0;
    const tick = () => {
      phase += 0.29;
      const speechPulse = (Math.sin(phase) * 0.5 + 0.5) * (0.55 + Math.random() * 0.45);
      amplitude.set(speechPulse * 0.82);
      animationRef.current = requestAnimationFrame(tick);
    };
    if (animationRef.current === null) animationRef.current = requestAnimationFrame(tick);
  }, [amplitude]);

  const finish = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
    busyRef.current = false;
    utteranceRef.current = null;
    stopAmplitude();
    setIsSpeaking(false);
    setActiveType(null);
    announce(false);
  }, [announce, stopAmplitude]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    finish();
  }, [finish]);

  const speak = useCallback(
    (type: PresenceEventType): boolean => {
      // A passagem rápida é propositalmente silenciosa.
      if (type === 'passing') return false;
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || busyRef.current) return false;

      const index = lineIndexRef.current % ENGAGED_LINES.length;
      lineIndexRef.current += 1;
      const text = ENGAGED_LINES[index];

      busyRef.current = true;
      setIsSpeaking(true);
      setActiveType(type);
      announce(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.96;
      utterance.pitch = 0.84;
      utterance.volume = 1;
      const voice = choosePortugueseVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = startAmplitude;
      utterance.onend = finish;
      utterance.onerror = finish;
      utteranceRef.current = utterance;

      // Protege contra um bug do Chromium em que onend não é emitido.
      watchdogRef.current = setTimeout(finish, Math.max(7_000, text.length * 95));

      try {
        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        finish();
        return false;
      }
    },
    [announce, finish, startAmplitude]
  );

  useEffect(() => {
    // Carrega a lista de vozes logo no início do modo quiosque.
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    return stop;
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    activeType,
    amplitude: amplitude as MotionValue<number>,
  };
}

'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useMotionValue, MotionValue } from 'framer-motion';
import { splitIntoSentences } from '@/lib/stripMarkdown';

/**
 * Voz humanizada via ElevenLabs (estilo JARVIS).
 *
 * - Gera o áudio no servidor (/api/tts) por sentença, com pré-busca da próxima
 *   enquanto a atual toca (pipeline → baixa latência percebida).
 * - Toca via Web Audio API e mede a AMPLITUDE REAL do áudio em tempo real
 *   (AnalyserNode → RMS), exposta como MotionValue para animar o avatar a 60fps
 *   sem causar re-render do React.
 * - Se a key da ElevenLabs não estiver configurada (503), faz fallback automático
 *   para a SpeechSynthesis do navegador, ainda alimentando a amplitude (senoide).
 */
export function useElevenLabsSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [usingNeural, setUsingNeural] = useState(false);

  // Amplitude 0..1 — dirige toda a reatividade visual do avatar
  const amplitude = useMotionValue(0);

  const ctxRef       = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const sourceRef    = useRef<AudioBufferSourceNode | null>(null);
  const rafRef       = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const dataRef      = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const utterRef     = useRef<SpeechSynthesisUtterance | null>(null); // evita GC do Chrome

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
        ('AudioContext' in window || 'webkitAudioContext' in window || 'speechSynthesis' in window)
    );
  }, []);

  // ─── Áudio / amplitude ──────────────────────────────────────────────────────
  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AC();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.75;
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize));
    }
    return ctxRef.current;
  }, []);

  const startAmpLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return;

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const x = (data[i] - 128) / 128;
        sum += x * x;
      }
      const rms = Math.sqrt(sum / data.length);
      // Realce + clamp para um movimento expressivo
      amplitude.set(Math.min(1, rms * 2.4));
      rafRef.current = requestAnimationFrame(tick);
    };
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
  }, [amplitude]);

  const stopAmpLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    amplitude.set(0);
  }, [amplitude]);

  // ─── Pipeline ElevenLabs ────────────────────────────────────────────────────
  const fetchAudio = useCallback(async (text: string): Promise<AudioBuffer | 'no-neural' | null> => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.status === 503) return 'no-neural'; // key ausente → fallback
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    const ctx = ensureContext();
    return await ctx.decodeAudioData(arr);
  }, [ensureContext]);

  const playBuffer = useCallback((buffer: AudioBuffer): Promise<void> => {
    return new Promise((resolve) => {
      const ctx = ctxRef.current;
      const analyser = analyserRef.current;
      if (!ctx || !analyser) { resolve(); return; }

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(analyser);
      sourceRef.current = src;
      src.onended = () => {
        if (sourceRef.current === src) sourceRef.current = null;
        resolve();
      };
      src.start();
    });
  }, []);

  // ─── Fallback: voz do navegador (com amplitude simulada) ──────────────────────
  const speakFallback = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!('speechSynthesis' in window)) { onEnd?.(); return; }
      window.speechSynthesis.cancel();

      const sentences = splitIntoSentences(text);
      const voices = window.speechSynthesis.getVoices();
      const male =
        voices.find((v) => /pt.?BR/i.test(v.lang) && /daniel|antonio|antônio|ricardo|male/i.test(v.name)) ||
        voices.find((v) => /pt.?BR/i.test(v.lang)) ||
        voices.find((v) => /^pt/i.test(v.lang)) ||
        null;

      // amplitude simulada (senoide modulada) enquanto fala
      let phase = 0;
      const fakeLoop = () => {
        phase += 0.35;
        const v = (Math.sin(phase) * 0.5 + 0.5) * (0.5 + Math.random() * 0.5);
        amplitude.set(v * 0.8);
        rafRef.current = requestAnimationFrame(fakeLoop);
      };

      const speakAt = (i: number) => {
        if (cancelledRef.current || i >= sentences.length) {
          stopAmpLoop();
          setIsSpeaking(false);
          onEnd?.();
          return;
        }
        const u = new SpeechSynthesisUtterance(sentences[i]);
        u.lang = 'pt-BR';
        u.rate = 0.95;
        u.pitch = 0.8;
        if (male) u.voice = male;
        u.onstart = () => {
          if (rafRef.current == null) rafRef.current = requestAnimationFrame(fakeLoop);
        };
        u.onend = () => {
          if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
          amplitude.set(0);
          setTimeout(() => speakAt(i + 1), 180);
        };
        u.onerror = () => { stopAmpLoop(); setIsSpeaking(false); onEnd?.(); };
        utterRef.current = u; // mantém referência viva (bug do Chrome: onend não dispara se a utterance for coletada)
        window.speechSynthesis.speak(u);
      };
      speakAt(0);
    },
    [amplitude, stopAmpLoop]
  );

  // ─── API pública ─────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    cancelledRef.current = true;
    try { sourceRef.current?.stop(); } catch {}
    sourceRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    stopAmpLoop();
    setIsSpeaking(false);
  }, [stopAmpLoop]);

  const speak = useCallback(
    async (text: string, onEnd?: () => void) => {
      if (!isSupported || !text.trim()) { onEnd?.(); return; }

      // reinicia estado
      cancelledRef.current = false;
      try { sourceRef.current?.stop(); } catch {}
      sourceRef.current = null;

      const sentences = splitIntoSentences(text);
      if (!sentences.length) { onEnd?.(); return; }

      setIsSpeaking(true);

      const ctx = ensureContext();
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch {}
      }

      // Tenta a primeira sentença na ElevenLabs; se 503 → fallback total
      let first: AudioBuffer | 'no-neural' | null;
      try {
        first = await fetchAudio(sentences[0]);
      } catch {
        first = null;
      }

      if (cancelledRef.current) { setIsSpeaking(false); return; }

      if (first === 'no-neural' || first === null) {
        setUsingNeural(false);
        speakFallback(text, onEnd);
        return;
      }

      // Caminho neural com pipeline (pré-busca da próxima sentença)
      setUsingNeural(true);
      startAmpLoop();

      let current: AudioBuffer | null = first;
      let nextPromise: Promise<AudioBuffer | 'no-neural' | null> =
        sentences.length > 1 ? fetchAudio(sentences[1]).catch(() => null) : Promise.resolve(null);

      for (let i = 0; i < sentences.length; i++) {
        if (cancelledRef.current) break;
        if (!current) {
          // falha numa sentença intermediária → fallback do restante
          speakFallback(sentences.slice(i).join(' '), onEnd);
          return;
        }

        const playing = playBuffer(current);
        // pré-busca da sentença i+2 enquanto a atual toca
        const prefetch =
          i + 2 < sentences.length ? fetchAudio(sentences[i + 2]).catch(() => null) : Promise.resolve(null);

        await playing;
        if (cancelledRef.current) break;

        const nxt = await nextPromise;
        current = nxt && nxt !== 'no-neural' ? nxt : null;
        nextPromise = prefetch as Promise<AudioBuffer | 'no-neural' | null>;

        amplitude.set(0); // boca fecha brevemente entre sentenças
      }

      stopAmpLoop();
      setIsSpeaking(false);
      if (!cancelledRef.current) onEnd?.();
    },
    [isSupported, ensureContext, fetchAudio, playBuffer, startAmpLoop, stopAmpLoop, speakFallback, amplitude]
  );

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      try { sourceRef.current?.stop(); } catch {}
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      try { ctxRef.current?.close(); } catch {}
    };
  }, []);

  return { speak, stop, isSpeaking, amplitude: amplitude as MotionValue<number>, isSupported, usingNeural };
}

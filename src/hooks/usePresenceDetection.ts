'use client';

import { useEffect, useRef, useState } from 'react';

interface UsePresenceDetectionOptions {
  enabled: boolean;
  onPresence: () => void;
  retryKey?: number;
  cooldownMs?: number;
}

export type PresenceStatus =
  | 'inactive'
  | 'loading'
  | 'active'
  | 'blocked'
  | 'unsupported'
  | 'error';

/**
 * Detecta movimento relevante na câmera enquanto o totem está no modo de
 * recepção. A análise é local, em baixa resolução, e nenhum quadro é enviado.
 */
export function usePresenceDetection({
  enabled,
  onPresence,
  retryKey = 0,
  cooldownMs = 12_000,
}: UsePresenceDetectionOptions) {
  const [status, setStatus] = useState<PresenceStatus>('inactive');
  const [message, setMessage] = useState('');
  const callbackRef = useRef(onPresence);

  useEffect(() => {
    callbackRef.current = onPresence;
  }, [onPresence]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setStatus('inactive');
      setMessage('');
      return;
    }

    let disposed = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let previous: Uint8ClampedArray | null = null;
    let previousMean = 0;
    let warmupFrames = 0;
    let motionFrames = 0;
    let lastPresenceAt = 0;

    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 60;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const analyze = () => {
      if (disposed || !ctx || video.readyState < 2) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const gray = new Uint8ClampedArray(canvas.width * canvas.height);

      let total = 0;
      for (let i = 0, p = 0; i < frame.length; i += 4, p += 1) {
        const value = Math.round(frame[i] * 0.299 + frame[i + 1] * 0.587 + frame[i + 2] * 0.114);
        gray[p] = value;
        total += value;
      }

      const mean = total / gray.length;
      if (!previous) {
        previous = gray;
        previousMean = mean;
        return;
      }

      warmupFrames += 1;
      let changed = 0;
      let diffTotal = 0;
      for (let i = 0; i < gray.length; i += 1) {
        const diff = Math.abs(gray[i] - previous[i]);
        diffTotal += diff;
        if (diff > 22) changed += 1;
      }

      const changedRatio = changed / gray.length;
      const averageDiff = diffTotal / gray.length;
      const brightnessShift = Math.abs(mean - previousMean);

      previous = gray;
      previousMean = mean;

      // Evita disparos por ruído ou por uma mudança global de iluminação.
      const meaningfulMotion =
        warmupFrames > 5 &&
        brightnessShift < 20 &&
        changedRatio > 0.045 &&
        averageDiff > 4.5;

      motionFrames = meaningfulMotion ? motionFrames + 1 : Math.max(0, motionFrames - 1);

      const now = Date.now();
      if (motionFrames >= 2 && now - lastPresenceAt >= cooldownMs) {
        motionFrames = 0;
        lastPresenceAt = now;
        callbackRef.current();
      }
    };

    const start = async () => {
      setStatus('loading');
      setMessage('Solicitando acesso à câmera...');

      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        setStatus('unsupported');
        setMessage('A câmera exige HTTPS ou acesso pelo endereço localhost.');
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported');
        setMessage('Este navegador não oferece acesso compatível à câmera.');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        video.srcObject = stream;
        await video.play();
        setStatus('active');
        setMessage('Câmera ativa — aguardando um visitante.');
        timer = setInterval(analyze, 280);
      } catch (error) {
        const name = error instanceof DOMException ? error.name : '';
        console.warn('[presence] camera unavailable:', error);
        if (disposed) return;

        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setStatus('blocked');
          setMessage('Permita o uso da câmera para reconhecer a chegada dos visitantes.');
        } else {
          setStatus('error');
          setMessage('Não foi possível iniciar a câmera. Verifique se ela está disponível.');
        }
      }
    };

    void start();

    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
      video.pause();
      video.srcObject = null;
    };
  }, [enabled, retryKey, cooldownMs]);

  return { status, message };
}

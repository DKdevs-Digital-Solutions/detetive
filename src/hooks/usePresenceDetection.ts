'use client';

import { useEffect, useRef, useState } from 'react';

export type PresenceEventType = 'passing' | 'engaged';
export type PresenceActivity = 'empty' | 'observing' | 'nearby';

export interface PresenceEvent {
  type: PresenceEventType;
  /** 0..1: estimativa local baseada no tamanho e estabilidade da silhueta. */
  confidence: number;
}

interface UsePresenceDetectionOptions {
  enabled: boolean;
  onPresence: (event: PresenceEvent) => void;
  retryKey?: number;
  /** Pausa somente os disparos; a câmera continua acompanhando a mesma pessoa. */
  suppressEvents?: boolean;
  /** Tempo mínimo parado e próximo para receber o convite. */
  engagedDwellMs?: number;
  /** Intervalo mínimo entre saudações de passagem. */
  passingCooldownMs?: number;
  /** Intervalo mínimo entre convites de participação. */
  engagedCooldownMs?: number;
}

export type PresenceStatus =
  | 'inactive'
  | 'loading'
  | 'active'
  | 'blocked'
  | 'unsupported'
  | 'error';

const WIDTH = 128;
const HEIGHT = 96;
const SAMPLE_INTERVAL_MS = 220;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Detector local de recepção para totem.
 *
 * Não usa IA generativa, reconhecimento facial ou servidor. Os quadros ficam no
 * navegador e são reduzidos para 128x96. O detector compara a silhueta com um
 * fundo adaptativo e classifica duas situações:
 *
 * - passing: presença curta que atravessa o campo da câmera;
 * - engaged: presença central, grande o bastante (aprox. 1 m) e estável.
 *
 * A distância é uma estimativa visual. Os limiares NEAR_* podem ser ajustados
 * conforme a altura e o campo de visão da câmera instalada no totem.
 */
export function usePresenceDetection({
  enabled,
  onPresence,
  retryKey = 0,
  suppressEvents = false,
  engagedDwellMs = 2_600,
  passingCooldownMs = 10_000,
  engagedCooldownMs = 25_000,
}: UsePresenceDetectionOptions) {
  const [status, setStatus] = useState<PresenceStatus>('inactive');
  const [message, setMessage] = useState('');
  const [activity, setActivity] = useState<PresenceActivity>('empty');
  const callbackRef = useRef(onPresence);
  const suppressRef = useRef(suppressEvents);

  useEffect(() => {
    callbackRef.current = onPresence;
  }, [onPresence]);

  useEffect(() => {
    suppressRef.current = suppressEvents;
  }, [suppressEvents]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setStatus('inactive');
      setMessage('');
      setActivity('empty');
      return;
    }

    let disposed = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let background: Float32Array | null = null;
    let previousFrame: Uint8ClampedArray | null = null;
    let warmupFrames = 0;
    let noPresenceFrames = 0;

    let presentSince = 0;
    let lastSeenAt = 0;
    let lastCentroidX = 0.5;
    let lastCentroidY = 0.5;
    let stableMs = 0;
    let maxForegroundRatio = 0;
    let maxNearScore = 0;
    let sessionEngaged = false;
    let sessionFinalized = true;
    let lastPassingAt = 0;
    let lastEngagedAt = 0;

    // Aproximação para cerca de 1 metro. Quanto mais aberta a câmera, menores
    // estes valores devem ser. Silhueta central com ~48% da altura já é "perto".
    const NEAR_HEIGHT_RATIO = 0.48;
    const NEAR_WIDTH_RATIO = 0.34;
    const NEAR_FOREGROUND_RATIO = 0.105;

    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const resetSession = () => {
      presentSince = 0;
      lastSeenAt = 0;
      stableMs = 0;
      maxForegroundRatio = 0;
      maxNearScore = 0;
      sessionEngaged = false;
      sessionFinalized = true;
      setActivity('empty');
      setMessage('Câmera ativa — aguardando um visitante.');
    };

    const emit = (type: PresenceEventType, confidence: number) => {
      if (suppressRef.current) return false;
      const now = Date.now();
      const cooldown = type === 'passing' ? passingCooldownMs : engagedCooldownMs;
      const lastAt = type === 'passing' ? lastPassingAt : lastEngagedAt;
      if (now - lastAt < cooldown) return false;

      if (type === 'passing') lastPassingAt = now;
      else lastEngagedAt = now;

      callbackRef.current({ type, confidence: clamp01(confidence) });
      return true;
    };

    const finalizePassing = (now: number) => {
      if (sessionFinalized || !presentSince) return;
      sessionFinalized = true;
      const duration = Math.max(0, lastSeenAt - presentSince);

      // Presença curta/móvel: cumprimenta apenas quando a pessoa termina de
      // atravessar o campo, evitando chamar quem ficou parado para participar.
      if (
        !sessionEngaged &&
        duration >= 450 &&
        duration <= 7_500 &&
        maxForegroundRatio >= 0.025
      ) {
        const durationScore = 1 - Math.min(1, Math.abs(duration - 2_100) / 5_400);
        const confidence = 0.45 + durationScore * 0.25 + Math.min(0.3, maxForegroundRatio * 1.4);
        emit('passing', confidence);
      }

      // Mantém o fundo congelado por alguns quadros após a saída para não
      // incorporar a pessoa à imagem de referência.
      noPresenceFrames = 0;
      if (now - lastSeenAt > 1_400) resetSession();
    };

    const analyze = () => {
      if (disposed || !ctx || video.readyState < 2) return;

      ctx.drawImage(video, 0, 0, WIDTH, HEIGHT);
      const rgba = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
      const gray = new Uint8ClampedArray(WIDTH * HEIGHT);
      let mean = 0;

      for (let i = 0, p = 0; i < rgba.length; i += 4, p += 1) {
        const value = Math.round(rgba[i] * 0.299 + rgba[i + 1] * 0.587 + rgba[i + 2] * 0.114);
        gray[p] = value;
        mean += value;
      }
      mean /= gray.length;

      if (!background) {
        background = Float32Array.from(gray);
        previousFrame = gray;
        warmupFrames = 1;
        return;
      }

      warmupFrames += 1;
      let changed = 0;
      let frameChanged = 0;
      let minX = WIDTH;
      let minY = HEIGHT;
      let maxX = -1;
      let maxY = -1;
      let sumX = 0;
      let sumY = 0;
      let centralChanged = 0;
      const rowCounts = new Uint16Array(HEIGHT);
      const columnCounts = new Uint16Array(WIDTH);
      let backgroundMean = 0;

      for (let i = 0; i < background.length; i += 1) backgroundMean += background[i];
      backgroundMean /= background.length;

      // Mudança global de iluminação: recalibra em vez de saudar uma sombra.
      if (Math.abs(mean - backgroundMean) > 32) {
        background = Float32Array.from(gray);
        previousFrame = gray;
        warmupFrames = 0;
        resetSession();
        setMessage('Recalibrando a câmera após mudança de iluminação...');
        return;
      }

      for (let i = 0; i < gray.length; i += 1) {
        const x = i % WIDTH;
        const y = Math.floor(i / WIDTH);
        const diff = Math.abs(gray[i] - background[i]);
        const frameDiff = previousFrame ? Math.abs(gray[i] - previousFrame[i]) : 0;

        if (frameDiff > 20) frameChanged += 1;

        // Ignora uma borda estreita, que costuma conter reflexos e telas ao lado.
        if (x < 4 || x >= WIDTH - 4 || y < 3 || y >= HEIGHT - 3) continue;
        if (diff > 25) {
          changed += 1;
          sumX += x;
          sumY += y;
          rowCounts[y] += 1;
          columnCounts[x] += 1;
          if (x >= WIDTH * 0.2 && x <= WIDTH * 0.8 && y >= HEIGHT * 0.12 && y <= HEIGHT * 0.92) {
            centralChanged += 1;
          }
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }

      previousFrame = gray;

      // Remove pontos isolados do contorno. O retângulo usa somente linhas e
      // colunas com densidade mínima de pixels alterados.
      const denseMinX = Array.from(columnCounts).findIndex((count) => count >= 3);
      let denseMaxX = -1;
      for (let x = WIDTH - 1; x >= 0; x -= 1) {
        if (columnCounts[x] >= 3) { denseMaxX = x; break; }
      }
      const denseMinY = Array.from(rowCounts).findIndex((count) => count >= 4);
      let denseMaxY = -1;
      for (let y = HEIGHT - 1; y >= 0; y -= 1) {
        if (rowCounts[y] >= 4) { denseMaxY = y; break; }
      }
      if (denseMinX >= 0 && denseMaxX >= denseMinX) { minX = denseMinX; maxX = denseMaxX; }
      if (denseMinY >= 0 && denseMaxY >= denseMinY) { minY = denseMinY; maxY = denseMaxY; }

      const foregroundRatio = changed / gray.length;
      const centralForegroundRatio = centralChanged / (WIDTH * 0.6 * HEIGHT * 0.8);
      const frameMotionRatio = frameChanged / gray.length;
      const hasSilhouette =
        warmupFrames > 8 &&
        changed > 140 &&
        foregroundRatio > 0.013 &&
        centralForegroundRatio > 0.006 &&
        maxX > minX &&
        maxY > minY;
      const now = Date.now();

      if (!hasSilhouette) {
        noPresenceFrames += 1;

        // Atualiza o fundo lentamente somente com o cenário vazio.
        if (noPresenceFrames > 5) {
          const alpha = noPresenceFrames > 30 ? 0.05 : 0.015;
          for (let i = 0; i < background.length; i += 1) {
            background[i] = background[i] * (1 - alpha) + gray[i] * alpha;
          }
        }

        if (presentSince && now - lastSeenAt >= 700) finalizePassing(now);
        if (presentSince && now - lastSeenAt >= 1_500) resetSession();
        else if (!presentSince) {
          setActivity('empty');
          setMessage('Câmera ativa — aguardando um visitante.');
        }
        return;
      }

      noPresenceFrames = 0;
      if (!presentSince || now - lastSeenAt > 1_500) {
        presentSince = now;
        sessionFinalized = false;
        sessionEngaged = false;
        stableMs = 0;
        maxForegroundRatio = 0;
        maxNearScore = 0;
      }
      lastSeenAt = now;

      const centroidX = (sumX / changed) / WIDTH;
      const centroidY = (sumY / changed) / HEIGHT;
      const widthRatio = (maxX - minX + 1) / WIDTH;
      const heightRatio = (maxY - minY + 1) / HEIGHT;
      const centroidMovement = Math.hypot(centroidX - lastCentroidX, centroidY - lastCentroidY);
      lastCentroidX = centroidX;
      lastCentroidY = centroidY;

      maxForegroundRatio = Math.max(maxForegroundRatio, foregroundRatio);

      const centered = centroidX >= 0.23 && centroidX <= 0.77 && centroidY >= 0.18 && centroidY <= 0.88;
      const sizeScore = Math.max(
        heightRatio / NEAR_HEIGHT_RATIO,
        widthRatio / NEAR_WIDTH_RATIO,
        foregroundRatio / NEAR_FOREGROUND_RATIO,
        centralForegroundRatio / 0.075,
      );
      const near = centered && sizeScore >= 1;
      const stable = near && centroidMovement < 0.045 && frameMotionRatio < 0.095;

      maxNearScore = Math.max(maxNearScore, Math.min(1.25, sizeScore));
      stableMs = stable
        ? Math.min(engagedDwellMs + 1_000, stableMs + SAMPLE_INTERVAL_MS)
        : Math.max(0, stableMs - SAMPLE_INTERVAL_MS * 0.65);

      setActivity(near ? 'nearby' : 'observing');
      if (near) {
        const remaining = Math.max(0, Math.ceil((engagedDwellMs - stableMs) / 1000));
        setMessage(
          remaining > 0
            ? `Pessoa próxima — observando por mais ${remaining}s para convidar.`
            : 'Pessoa próxima e parada — pronta para o convite.'
        );
      } else {
        setMessage('Movimento detectado — verificando se a pessoa está passando.');
      }

      const duration = now - presentSince;
      if (!sessionEngaged && near && duration >= engagedDwellMs && stableMs >= Math.min(1_550, engagedDwellMs * 0.65)) {
        const confidence = 0.55 + Math.min(0.25, stableMs / 12_000) + Math.min(0.2, maxNearScore * 0.14);
        if (emit('engaged', confidence)) {
          sessionEngaged = true;
          sessionFinalized = true;
          setMessage('Convite realizado — aguardando interação na tela.');
        }
      }
    };

    const start = async () => {
      setStatus('loading');
      setActivity('empty');
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
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
            frameRate: { ideal: 15, max: 24 },
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
        setMessage('Câmera ativa — calibrando o ambiente...');
        timer = setInterval(analyze, SAMPLE_INTERVAL_MS);
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
  }, [enabled, retryKey, engagedDwellMs, passingCooldownMs, engagedCooldownMs]);

  return { status, message, activity };
}

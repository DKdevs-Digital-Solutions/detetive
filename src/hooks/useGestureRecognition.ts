'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GestureType } from '@/types';
import { classifyLibras, LibrasResult, MotionPoint } from '@/lib/libras';

interface UseGestureOptions {
  onGesture: (gesture: GestureType) => void;
  enabled: boolean;
  librasMode?: boolean;
}

interface Landmark {
  x: number;
  y: number;
  z: number;
}

function classifyGesture(
  landmarks: Landmark[],
  palmHistory: { x: number; y: number }[]
): GestureType {
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const indexMCP = landmarks[5];
  const middleTip = landmarks[12];
  const middleMCP = landmarks[9];
  const ringTip = landmarks[16];
  const ringMCP = landmarks[13];
  const pinkyTip = landmarks[20];
  const pinkyMCP = landmarks[17];

  const T = 0.04;

  const indexExt = indexTip.y < indexMCP.y - T;
  const middleExt = middleTip.y < middleMCP.y - T;
  const ringExt = ringTip.y < ringMCP.y - T;
  const pinkyExt = pinkyTip.y < pinkyMCP.y - T;

  if (indexExt && middleExt && ringExt && pinkyExt) return 'open_hand';
  if (indexExt && !middleExt && !ringExt && !pinkyExt) return 'pointing_up';

  const fingersCurled = !indexExt && !middleExt;
  if (fingersCurled) {
    if (thumbTip.y < wrist.y - 0.15) return 'thumbs_up';
    if (thumbTip.y > wrist.y + 0.10) return 'thumbs_down';
  }

  if (palmHistory.length >= 10) {
    const xs = palmHistory.map((p) => p.x);
    const ys = palmHistory.map((p) => p.y);
    const xRange = Math.max(...xs) - Math.min(...xs);
    const yRange = Math.max(...ys) - Math.min(...ys);
    if (xRange > 0.2 && yRange > 0.15) return 'circular';
  }

  return null;
}

async function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export function useGestureRecognition({ onGesture, enabled, librasMode = false }: UseGestureOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'inactive' | 'loading' | 'active' | 'error'>('inactive');
  const [librasSign, setLibrasSign] = useState<LibrasResult>({ letter: null, description: '', confidence: 'low' });
  const handsRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const processingRef = useRef(false);
  const palmHistoryRef = useRef<{ x: number; y: number }[]>([]);
  const lastGestureRef = useRef<GestureType>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const librasModeRef = useRef(librasMode);
  // LIBRAS: histórico de pontas (J/Z) + estabilização temporal
  const librasHistoryRef = useRef<MotionPoint[]>([]);
  const librasLastRef = useRef<string | null>(null);
  const librasStableRef = useRef(0);
  const speechBusyRef = useRef(false);

  useEffect(() => { librasModeRef.current = librasMode; }, [librasMode]);

  useEffect(() => {
    const onSpeechStart = () => { speechBusyRef.current = true; };
    const onSpeechEnd = () => { speechBusyRef.current = false; };
    window.addEventListener('detetive:speech-start', onSpeechStart);
    window.addEventListener('detetive:speech-end', onSpeechEnd);
    return () => {
      window.removeEventListener('detetive:speech-start', onSpeechStart);
      window.removeEventListener('detetive:speech-end', onSpeechEnd);
    };
  }, []);

  const emitGesture = useCallback(
    (gesture: GestureType) => {
      if (speechBusyRef.current || gesture === lastGestureRef.current) return;
      lastGestureRef.current = gesture;
      if (gesture) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          onGesture(gesture);
          lastGestureRef.current = null;
        }, 600);
      }
    },
    [onGesture]
  );

  const handleResults = useCallback(
    (results: any) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Feed de câmera espelhado
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      if (results.image) {
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      ctx.restore();

      const hands: Landmark[][] = results.multiHandLandmarks || [];

      if (hands.length >= 2 && !librasModeRef.current) {
        emitGesture('two_hands');
        palmHistoryRef.current = [];
        librasHistoryRef.current = [];
        setLibrasSign({ letter: null, description: '', confidence: 'low' });
      } else if (hands.length >= 1) {
        const lms = hands[0];
        const wrist = lms[0];

        // Desenha esqueleto da mão (espelhado)
        const dotColor = librasModeRef.current ? '#b388ff' : '#00d4ff';
        ctx.fillStyle = dotColor;
        for (const lm of lms) {
          const x = (1 - lm.x) * canvas.width;
          const y = lm.y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        if (librasModeRef.current) {
          // Modo LIBRAS: histórico de movimento das pontas + classificação
          librasHistoryRef.current = [
            ...librasHistoryRef.current.slice(-13),
            { ix: lms[8].x, iy: lms[8].y, px: lms[20].x, py: lms[20].y },
          ];
          const result = classifyLibras(lms, librasHistoryRef.current);

          // Estabilização: só atualiza após N frames consistentes (evita flicker)
          if (result.letter === librasLastRef.current) {
            librasStableRef.current += 1;
          } else {
            librasLastRef.current = result.letter;
            librasStableRef.current = 1;
          }
          const need = result.letter ? 3 : 6;
          if (librasStableRef.current === need) setLibrasSign(result);
        } else {
          // Modo gesto: classificar navegação
          palmHistoryRef.current = [
            ...palmHistoryRef.current.slice(-20),
            { x: wrist.x, y: wrist.y },
          ];
          const gesture = classifyGesture(lms, palmHistoryRef.current);
          emitGesture(gesture);
          librasHistoryRef.current = [];
          setLibrasSign({ letter: null, description: '', confidence: 'low' });
        }
      } else {
        palmHistoryRef.current = [];
        librasHistoryRef.current = [];
        librasLastRef.current = null;
        librasStableRef.current = 0;
        setLibrasSign({ letter: null, description: '', confidence: 'low' });
      }
    },
    [emitGesture]
  );

  const startDetection = useCallback(async () => {
    setStatus('loading');
    try {
      const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915';
      await loadScript(`${CDN}/hands.js`);

      const HandsClass = (window as any).Hands;
      if (!HandsClass) throw new Error('MediaPipe Hands not found');

      const hands = new HandsClass({
        locateFile: (file: string) => `${CDN}/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(handleResults);
      handsRef.current = hands;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus('active');

      const detect = async () => {
        if (!processingRef.current && videoRef.current && handsRef.current) {
          processingRef.current = true;
          try {
            await handsRef.current.send({ image: videoRef.current });
          } catch { /* skip frame */ }
          processingRef.current = false;
        }
        rafRef.current = requestAnimationFrame(detect);
      };

      detect();
    } catch (err) {
      console.warn('[gesture] setup failed:', err);
      setStatus('error');
    }
  }, [handleResults]);

  const stopDetection = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    handsRef.current?.close?.();
    handsRef.current = null;
    streamRef.current = null;
    processingRef.current = false;
    palmHistoryRef.current = [];
    librasHistoryRef.current = [];
    librasLastRef.current = null;
    librasStableRef.current = 0;
    setStatus('inactive');
    setLibrasSign({ letter: null, description: '', confidence: 'low' });
  }, []);

  useEffect(() => {
    if (enabled) {
      startDetection();
    } else {
      stopDetection();
    }
    return () => stopDetection();
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { videoRef, canvasRef, status, librasSign };
}

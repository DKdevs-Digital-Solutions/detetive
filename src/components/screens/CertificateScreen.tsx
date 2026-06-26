'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/types';
import { useGame } from '@/context/GameProvider';

interface Props {
  onNavigate: (screen: Screen) => void;
  onComplete: () => void; // reinicia a sessão (limpa progresso, volta ao início)
  controlCode: string;     // sala da sessão (para upload da foto e sync com o celular)
}

type Step = 'waiting' | 'camera' | 'success';
type PhotoState = 'idle' | 'live' | 'captured' | 'attached' | 'error';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Compõe a polaroid temática a partir do quadro atual do vídeo (espelhado).
function composePolaroid(video: HTMLVideoElement): string {
  const W = 900;
  const pad = 40;
  const photo = W - pad * 2; // foto quadrada
  const H = pad + photo + 200; // moldura + legenda
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/jpeg', 0.85);

  // Moldura branca (papel)
  ctx.fillStyle = '#fdfdf7';
  ctx.fillRect(0, 0, W, H);

  // Foto (recorte quadrado central do vídeo, espelhado)
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 720;
  const side = Math.min(vw, vh);
  const sx = (vw - side) / 2;
  const sy = (vh - side) / 2;
  ctx.save();
  ctx.translate(pad + photo, pad);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, side, side, 0, 0, photo, photo);
  ctx.restore();

  // Contorno sutil no tema
  ctx.strokeStyle = 'rgba(0,40,80,0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, photo, photo);

  // Legenda
  const capY = pad + photo + 56;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0a2a44';
  ctx.font = '700 60px Georgia, "Times New Roman", serif';
  ctx.fillText('Detetive IA', W / 2, capY);
  ctx.fillStyle = '#3a6b88';
  ctx.font = '400 28px Arial, sans-serif';
  ctx.fillText('Feira de Ciências e Tecnologias', W / 2, capY + 46);
  ctx.fillStyle = '#8aa0b4';
  ctx.font = '400 24px Arial, sans-serif';
  ctx.fillText(new Date().toLocaleDateString('pt-BR'), W / 2, capY + 86);

  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function CertificateScreen({ onNavigate, onComplete, controlCode }: Props) {
  const { markCertificateIssued, resetJourney } = useGame();
  const [step, setStep] = useState<Step>('waiting');
  const [photoState, setPhotoState] = useState<PhotoState>('idle');
  const [captured, setCaptured] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [name, setName] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoStateRef = useRef<PhotoState>('idle');
  useEffect(() => { photoStateRef.current = photoState; }, [photoState]);

  // ─── helpers ────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Atualiza o estado local E avisa o celular para acompanhar o passo.
  const setPhase = useCallback((ps: PhotoState) => {
    setPhotoState(ps);
    if (controlCode) {
      fetch('/api/control/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: controlCode, command: { from: 'display', type: 'photo-state', photoState: ps } }),
      }).catch(() => {});
    }
  }, [controlCode]);

  const clearServerPhoto = useCallback(() => {
    if (!controlCode) return;
    fetch('/api/control/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: controlCode, clear: true }),
    }).catch(() => {});
  }, [controlCode]);

  const startCamera = useCallback(async () => {
    setCaptured(null);
    setCountdown(0);
    setStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase('live');
    } catch {
      setPhase('error');
    }
  }, [setPhase]);

  // Anexa o stream ao <video> assim que ele aparece (passo 'camera' + 'live').
  useEffect(() => {
    if (step === 'camera' && photoState === 'live' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [step, photoState]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    for (let n = 3; n >= 1; n -= 1) { setCountdown(n); await wait(750); }
    setCountdown(0);
    const dataUrl = composePolaroid(video);
    setCaptured(dataUrl);
    stopCamera();
    setPhase('captured');
    if (controlCode) {
      fetch('/api/control/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: controlCode, photo: dataUrl }),
      }).catch(() => {});
    }
  }, [stopCamera, setPhase, controlCode]);

  const confirmPhoto = useCallback(() => {
    stopCamera();
    setStep('waiting');
    setPhase('attached');
  }, [stopCamera, setPhase]);

  const skipPhoto = useCallback(() => {
    stopCamera();
    setCaptured(null);
    clearServerPhoto();
    setStep('waiting');
    setPhase('idle');
  }, [stopCamera, clearServerPhoto, setPhase]);

  // ─── comandos vindos do celular (via AppShell → evento) ───────────────────────
  const actionsRef = useRef<(a: string) => void>(() => {});
  useEffect(() => {
    actionsRef.current = (action: string) => {
      switch (action) {
        case 'photo-start': void startCamera(); break;
        case 'photo-shoot': if (photoStateRef.current === 'live') void capture(); break;
        case 'photo-retake': void startCamera(); break;
        case 'photo-confirm': confirmPhoto(); break;
        case 'photo-skip': skipPhoto(); break;
      }
    };
  }, [startCamera, capture, confirmPhoto, skipPhoto]);

  useEffect(() => {
    const onPhoto = (e: Event) => actionsRef.current((e as CustomEvent<{ action?: string }>).detail?.action || '');
    window.addEventListener('detetive:photo', onPhoto);
    return () => window.removeEventListener('detetive:photo', onPhoto);
  }, []);

  // Sincroniza o estado inicial com o celular ao abrir a tela; para a câmera ao sair.
  useEffect(() => {
    setPhase('idle');
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O envio acontece no CELULAR. Quando confirma, o totem reconhece e mostra sucesso.
  useEffect(() => {
    const onSent = (e: Event) => {
      const detail = (e as CustomEvent<{ channel?: string; name?: string }>).detail || {};
      setChannel(detail.channel === 'email' ? 'email' : 'whatsapp');
      setName((detail.name || '').trim());
      stopCamera();
      markCertificateIssued();
      setStep('success');
    };
    window.addEventListener('detetive:cert-sent', onSent);
    return () => window.removeEventListener('detetive:cert-sent', onSent);
  }, [markCertificateIssued, stopCamera]);

  // Sucesso → aguarda alguns segundos e reinicia a sessão SOZINHO.
  useEffect(() => {
    if (step !== 'success') return;
    const t = setTimeout(() => { resetJourney(); onComplete(); }, 6000);
    return () => clearTimeout(t);
  }, [step, resetJourney, onComplete]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 overflow-y-auto py-6">
      <AnimatePresence mode="wait">
        {/* ─── CABINE DE FOTOS ─── */}
        {step === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-5 w-full max-w-md text-center"
          >
            <h1 className="text-3xl font-black" style={{ color: '#00d4ff' }}>Cabine de fotos</h1>

            {captured ? (
              <img
                src={captured}
                alt="Sua foto"
                className="rounded-xl shadow-lg"
                style={{ width: '100%', maxWidth: 360, height: 'auto', border: '1px solid rgba(0,212,255,0.25)' }}
              />
            ) : (
              <div
                className="relative rounded-xl overflow-hidden"
                style={{ width: '100%', maxWidth: 440, aspectRatio: '1 / 1', background: '#04121f', border: '2px solid rgba(0,212,255,0.4)' }}
              >
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                {/* Moldura polaroid (guia visual) */}
                <div className="absolute inset-3 pointer-events-none" style={{ border: '3px solid rgba(255,255,255,0.65)', borderRadius: 8 }} />
                <AnimatePresence>
                  {countdown > 0 && (
                    <motion.div
                      key={countdown}
                      initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.6, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'rgba(2,6,16,0.35)' }}
                    >
                      <span style={{ fontSize: 150, fontWeight: 900, color: '#fff', textShadow: '0 0 36px #00d4ff' }}>{countdown}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {photoState === 'error' ? (
              <p className="text-sm" style={{ color: '#ffaa00' }}>
                Não consegui acessar a câmera do totem. Você pode seguir sem foto pelo celular.
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {captured
                  ? 'Gostou? Confirme ou refaça no seu celular.'
                  : 'Posicione-se em frente ao totem e toque em Disparar no celular.'}
              </p>
            )}
          </motion.div>
        )}

        {/* ─── AGUARDANDO O PREENCHIMENTO NO CELULAR ─── */}
        {step === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-6 text-center max-w-lg"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 16 }}
              className="rounded-full flex items-center justify-center"
              style={{ width: 96, height: 96, background: 'rgba(0,212,255,0.12)', border: '2px solid #00d4ff' }}
            >
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
                <path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="#00d4ff" strokeWidth="1.8" />
                <path d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5" stroke="#00d4ff" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </motion.div>

            <div>
              <h1 className="text-3xl font-black" style={{ color: '#00d4ff' }}>Investigação concluída!</h1>
              <p className="text-base mt-2" style={{ color: 'var(--text-secondary)' }}>
                Você completou todas as fases. Agora pegue o seu certificado pelo celular.
              </p>
            </div>

            {captured && photoState === 'attached' && (
              <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: 'rgba(0,221,102,0.08)', border: '1px solid rgba(0,221,102,0.4)' }}>
                <img src={captured} alt="Foto" style={{ width: 56, height: 'auto', borderRadius: 6 }} />
                <p className="text-sm font-semibold" style={{ color: '#00dd66' }}>Foto recordação anexada ao certificado.</p>
              </div>
            )}

            <div className="w-full rounded-2xl p-5 flex flex-col gap-3 text-left" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <PhoneStep n={1} text="Pegue o celular que você usou para conduzir a jornada." />
              <PhoneStep n={2} text="Tire uma foto recordação (opcional) e digite o seu nome." />
              <PhoneStep n={3} text="Escolha WhatsApp ou email e toque em Enviar." />
            </div>

            <div className="flex items-center gap-3" style={{ color: '#00d4ff' }}>
              <span className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: 'currentColor' }}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </span>
              <span className="text-sm font-semibold">Aguardando você no celular...</span>
            </div>

            <button onClick={() => onNavigate('home')} className="btn btn-ghost text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Voltar ao início
            </button>
          </motion.div>
        )}

        {/* ─── SUCESSO (reinicia sozinho) ─── */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="rounded-full flex items-center justify-center"
              style={{ width: 96, height: 96, background: 'rgba(0,221,102,0.15)', border: '2px solid #00dd66' }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#00dd66" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold" style={{ color: '#00dd66' }}>
              {channel === 'email' ? 'Email registrado!' : 'Certificado enviado!'}
            </h2>
            <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
              {channel === 'email'
                ? <>Anotamos o seu email. O certificado será enviado em breve. Obrigado por participar{name ? `, ${name}` : ''}!</>
                : <>Enviamos o certificado{captured ? ' e a sua foto' : ''} para o seu WhatsApp. Obrigado por participar{name ? `, ${name}` : ''}!</>}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Voltando para o início...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhoneStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: 'rgba(0,212,255,0.18)', color: '#00d4ff' }}
      >
        {n}
      </span>
      <p className="text-sm pt-0.5" style={{ color: 'var(--text-secondary)' }}>{text}</p>
    </div>
  );
}

'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, MotionValue } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import { useGame } from '@/context/GameProvider';
import { usePresenceDetection } from '@/hooks/usePresenceDetection';

interface Props {
  open: boolean;
  onDismiss: () => void;
  onPresenceDetected: () => void;
  isGreeting: boolean;
  amplitude: MotionValue<number>;
}

const TAGLINES = [
  'Investigando a verdade.',
  'Será que a IA pode errar?',
  'Pense antes de compartilhar.',
  'Tecnologia para investigar o que é real.',
];

// Palavras temáticas que flutuam ao fundo
const KEYWORDS = [
  { t: 'VERDADE',   x: 12, y: 26, delay: 0.0, size: 22 },
  { t: 'FAKE NEWS', x: 74, y: 20, delay: 1.1, size: 26 },
  { t: 'IA',        x: 30, y: 66, delay: 0.5, size: 30 },
  { t: 'FONTE?',    x: 82, y: 60, delay: 1.8, size: 20 },
  { t: 'VERIFICAR', x: 58, y: 80, delay: 0.8, size: 22 },
  { t: 'PENSE',     x: 8,  y: 54, delay: 2.2, size: 24 },
  { t: 'DESCONFIE', x: 66, y: 40, delay: 1.5, size: 18 },
];

// Constelação de dados (coords em 0..100, viewBox esticado)
const NODES = [
  { x: 15, y: 20 }, { x: 35, y: 12 }, { x: 55, y: 25 }, { x: 78, y: 15 },
  { x: 88, y: 35 }, { x: 70, y: 48 }, { x: 50, y: 62 }, { x: 28, y: 52 },
  { x: 12, y: 72 }, { x: 40, y: 84 }, { x: 64, y: 80 }, { x: 86, y: 70 },
];
const LINKS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
  [7, 8], [8, 9], [9, 10], [10, 11], [11, 5], [6, 10], [2, 5], [1, 7],
];

export default function ScreenSaver({
  open,
  onDismiss,
  onPresenceDetected,
  isGreeting,
  amplitude,
}: Props) {
  const { resetJourney } = useGame();
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [presenceActive, setPresenceActive] = useState(false);
  const [reactionKey, setReactionKey] = useState(0);
  const [cameraRetry, setCameraRetry] = useState(0);
  const visualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePresence = useCallback(() => {
    setPresenceActive(true);
    setReactionKey((key) => key + 1);
    onPresenceDetected();
    if (visualTimerRef.current) clearTimeout(visualTimerRef.current);
    visualTimerRef.current = setTimeout(() => setPresenceActive(false), 7500);
  }, [onPresenceDetected]);

  const { status: cameraStatus, message: cameraMessage } = usePresenceDetection({
    enabled: open,
    onPresence: handlePresence,
    retryKey: cameraRetry,
  });

  useEffect(() => {
    if (!open) {
      setPresenceActive(false);
      if (visualTimerRef.current) clearTimeout(visualTimerRef.current);
      return;
    }
    const t = setInterval(() => setTaglineIdx((i) => (i + 1) % TAGLINES.length), 3800);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => () => {
    if (visualTimerRef.current) clearTimeout(visualTimerRef.current);
  }, []);

  const dismiss = () => {
    resetJourney(); // novo visitante começa do zero
    onDismiss();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden flex flex-col items-center justify-center select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{ background: 'var(--bg-primary)' }}
          onPointerDown={(e) => { e.stopPropagation(); dismiss(); }}
        >
          {/* Identificação evidente do novo fluxo de recepção */}
          <motion.div
            className="absolute top-7 z-20 flex items-center gap-3 px-5 py-2.5 rounded-full pointer-events-none"
            style={{
              background: 'rgba(0,20,40,0.86)',
              border: '1px solid rgba(0,255,157,0.55)',
              boxShadow: '0 0 28px rgba(0,255,157,0.18)',
            }}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: '#00ff9d' }}
              animate={{ opacity: [0.35, 1, 0.35], scale: [0.85, 1.25, 0.85] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <span className="text-xs font-black tracking-[0.24em]" style={{ color: '#dffff4' }}>
              MODO RECEPÇÃO ATIVO
            </span>
          </motion.div>

          {/* Grade de fundo */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)',
              backgroundSize: '70px 70px',
            }}
          />
          {/* Brilho radial */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,102,255,0.12) 0%, transparent 65%)' }}
          />

          {/* Varredura de radar */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: '200vmax', height: '200vmax', borderRadius: '50%',
              background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,212,255,0.10) 25deg, transparent 55deg)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          />

          {/* Constelação de dados */}
          <motion.svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ opacity: 0.55 }}
            animate={{ rotate: [0, 2.5, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          >
            {LINKS.map(([a, b], i) => (
              <motion.line
                key={i}
                x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
                stroke="rgba(0,180,255,0.25)" strokeWidth="0.15"
                animate={{ opacity: [0.12, 0.4, 0.12] }}
                transition={{ duration: 4 + (i % 4), repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
            {NODES.map((n, i) => (
              <motion.circle
                key={i}
                cx={n.x} cy={n.y} r="0.6" fill="#00d4ff"
                animate={{ opacity: [0.3, 1, 0.3], r: [0.5, 0.85, 0.5] }}
                transition={{ duration: 2.4 + i * 0.18, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </motion.svg>

          {/* Palavras temáticas flutuantes */}
          {KEYWORDS.map((k) => (
            <motion.span
              key={k.t}
              className="absolute font-bold tracking-widest pointer-events-none"
              style={{
                left: `${k.x}%`, top: `${k.y}%`, fontSize: k.size,
                color: 'rgba(0,212,255,0.12)',
                textShadow: '0 0 18px rgba(0,212,255,0.15)',
              }}
              animate={{ y: [0, -22, 0], opacity: [0.1, 0.28, 0.1] }}
              transition={{ duration: 7 + k.delay, repeat: Infinity, delay: k.delay, ease: 'easeInOut' }}
            >
              {k.t}
            </motion.span>
          ))}

          <AnimatePresence>
            {presenceActive && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.75, 0.28] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                style={{
                  background: 'radial-gradient(circle at 50% 48%, rgba(255,77,126,0.24), rgba(0,212,255,0.08) 42%, transparent 72%)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Núcleo central do Detetive */}
          <div className="relative z-10 flex flex-col items-center gap-5">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Image
                src="/logo-raeder-pb.png"
                alt="Colégio Monsenhor Raeder"
                width={270}
                height={80}
                priority
                draggable={false}
                className="h-auto w-[250px] object-contain drop-shadow-[0_0_18px_rgba(255,255,255,0.12)]"
              />
            </motion.div>

            <div className="relative">
              <Avatar
                status={isGreeting ? 'responding' : 'idle'}
                isSpeaking={isGreeting}
                amplitude={amplitude}
                reaction={presenceActive ? 'heart' : null}
                reactionKey={reactionKey}
                size={260}
              />

              <AnimatePresence>
                {presenceActive && [0, 1, 2, 3, 4].map((heart) => (
                  <motion.div
                    key={`welcome-heart-${reactionKey}-${heart}`}
                    className="absolute pointer-events-none"
                    style={{ left: `${12 + heart * 19}%`, top: '52%' }}
                    initial={{ opacity: 0, scale: 0.4, y: 10 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.4, 1.15, 0.85], y: -120 - heart * 12 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.4, delay: heart * 0.18, ease: 'easeOut' }}
                  >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="#ff4d7e">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="text-center">
              <motion.h1
                className="text-5xl font-black tracking-tight"
                style={{ color: '#00d4ff', textShadow: '0 0 40px rgba(0,212,255,0.6)' }}
                animate={{ textShadow: ['0 0 30px rgba(0,212,255,0.4)', '0 0 55px rgba(0,212,255,0.8)', '0 0 30px rgba(0,212,255,0.4)'] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                DETETIVE <span style={{ color: '#ffffff' }}>IA</span>
              </motion.h1>

              <div className="h-16 mt-3 overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {presenceActive ? (
                    <motion.div
                      key="presence-welcome"
                      initial={{ y: 18, opacity: 0, scale: 0.96 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -18, opacity: 0 }}
                      transition={{ duration: 0.45 }}
                      className="text-center"
                    >
                      <p className="text-xl font-black" style={{ color: '#ff7aa2', textShadow: '0 0 22px rgba(255,77,126,0.55)' }}>
                        Olá! Bem-vindo à Feira de Ciências! ❤
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Que bom ter você aqui. Toque na tela para começar.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      key={taglineIdx}
                      initial={{ y: 22, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -22, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-base font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {TAGLINES[taglineIdx]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Chamada para ação */}
            <motion.div
              className="flex items-center gap-3 px-6 py-3 rounded-full mt-2"
              style={{ background: 'rgba(0,50,90,0.4)', border: '1px solid rgba(0,212,255,0.35)' }}
              animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 0 rgba(0,212,255,0)', '0 0 28px rgba(0,212,255,0.45)', '0 0 0 rgba(0,212,255,0)'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.svg
                width="22" height="22" viewBox="0 0 24 24" fill="none"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ color: '#00d4ff' }}
              >
                <path d="M9 11.5V5.5a1.5 1.5 0 0 1 3 0V11M12 11V4.5a1.5 1.5 0 0 1 3 0V11M15 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5.2-3l-1.6-2.8a1.5 1.5 0 0 1 2.4-1.8L9 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
              <span className="text-lg font-bold" style={{ color: '#fff' }}>Toque para começar</span>
            </motion.div>
          </div>

          {/* Estado da câmera: visível para facilitar a instalação no totem */}
          <div className="absolute bottom-5 z-20 flex flex-col items-center gap-2">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold tracking-[0.16em]"
              style={{
                color: cameraStatus === 'active' ? '#b9ffe4' : '#ffe0a6',
                background: 'rgba(0,12,26,0.82)',
                border: `1px solid ${cameraStatus === 'active' ? 'rgba(0,221,136,0.38)' : 'rgba(255,170,0,0.42)'}`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: cameraStatus === 'active' ? '#00dd88' : cameraStatus === 'loading' ? '#00d4ff' : '#ffaa00',
                }}
              />
              {cameraStatus === 'active'
                ? 'CÂMERA ATIVA · APROXIME-SE'
                : cameraStatus === 'loading'
                ? 'PREPARANDO CÂMERA'
                : 'CÂMERA PRECISA DE ATENÇÃO'}
            </div>

            {cameraStatus !== 'active' && cameraStatus !== 'loading' && (
              <div className="flex flex-col items-center gap-2">
                <p className="max-w-lg text-center text-xs" style={{ color: 'rgba(255,225,175,0.88)' }}>
                  {cameraMessage}
                </p>
                {(cameraStatus === 'blocked' || cameraStatus === 'error') && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full text-xs font-bold"
                    style={{
                      color: '#07131f',
                      background: '#ffaa00',
                      boxShadow: '0 0 20px rgba(255,170,0,0.25)',
                    }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setCameraRetry((value) => value + 1);
                    }}
                  >
                    Autorizar câmera novamente
                  </button>
                )}
              </div>
            )}

            <div className="text-xs tracking-[0.3em] pointer-events-none" style={{ color: 'rgba(0,212,255,0.32)' }}>
              FEIRA DE CIÊNCIAS · RECEPÇÃO INTELIGENTE
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

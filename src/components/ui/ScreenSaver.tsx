'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import { useGame } from '@/context/GameProvider';

interface Props {
  open: boolean;
  onDismiss: () => void;
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

export default function ScreenSaver({ open, onDismiss }: Props) {
  const { resetJourney } = useGame();
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setTaglineIdx((i) => (i + 1) % TAGLINES.length), 3800);
    return () => clearInterval(t);
  }, [open]);

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

            <Avatar status="idle" size={260} />

            <div className="text-center">
              <motion.h1
                className="text-5xl font-black tracking-tight"
                style={{ color: '#00d4ff', textShadow: '0 0 40px rgba(0,212,255,0.6)' }}
                animate={{ textShadow: ['0 0 30px rgba(0,212,255,0.4)', '0 0 55px rgba(0,212,255,0.8)', '0 0 30px rgba(0,212,255,0.4)'] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                DETETIVE <span style={{ color: '#ffffff' }}>IA</span>
              </motion.h1>

              <div className="h-7 mt-3 overflow-hidden">
                <AnimatePresence mode="popLayout">
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

          {/* Marca d'água inferior */}
          <div className="absolute bottom-6 text-xs tracking-[0.3em] pointer-events-none" style={{ color: 'rgba(0,212,255,0.3)' }}>
            FEIRA DE CIÊNCIAS
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

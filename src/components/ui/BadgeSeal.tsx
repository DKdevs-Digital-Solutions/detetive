'use client';

import { motion } from 'framer-motion';
import { BadgeId } from '@/types';

// Glifo divertido (SVG, sem emoji) por atividade
const GLYPHS: Record<BadgeId, React.ReactNode> = {
  // Conversa — balão de fala sorridente
  assistant: (
    <>
      <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.4A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
      <circle cx="9.3" cy="11" r="1.05" fill="currentColor" />
      <circle cx="14.7" cy="11" r="1.05" fill="currentColor" />
      <path d="M9 13.6c.8.9 1.9 1.4 3 1.4s2.2-.5 3-1.4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  // Notícia — jornal
  news: (
    <>
      <path d="M5 5h11a1 1 0 0 1 1 1v12a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
      <rect x="7" y="8" width="5" height="4" rx="0.6" fill="currentColor" />
      <path d="M14 8.5h1.5M14 11h1.5M7 14.5h8.5M7 17h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  // Quiz — lâmpada (ideia!)
  quiz: (
    <>
      <path d="M12 3a6 6 0 0 0-3.8 10.6c.5.5.8 1.1.8 1.8V16h6v-.6c0-.7.3-1.3.8-1.8A6 6 0 0 0 12 3z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
      <path d="M9.5 19h5M10.5 21.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  // Checklist — prancheta com check
  checklist: (
    <>
      <rect x="5.5" y="4.5" width="13" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <path d="M9 4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V6H9z" fill="currentColor" />
      <path d="M8.6 12.2l2.2 2.2 4.4-4.4" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // Erros da IA — robozinho
  'ai-errors': (
    <>
      <circle cx="12" cy="4" r="1.4" fill="currentColor" />
      <path d="M12 5.4V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="5" y="8" width="14" height="11" rx="3.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <path d="M3.5 12.5v3M20.5 12.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="9.6" cy="13.2" r="1.4" fill="currentColor" />
      <circle cx="14.4" cy="13.2" r="1.4" fill="currentColor" />
      <path d="M10 16.4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
};

// Borda serrilhada (estilo adesivo/selo)
function scallopPath(points: number, outer: number, inner: number, cx = 24, cy = 24): string {
  const total = points * 2;
  let d = '';
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d + 'Z';
}

const SCALLOP = scallopPath(12, 23, 20);

interface Props {
  id: BadgeId;
  color: string;
  earned: boolean;
  size?: number;
}

export default function BadgeSeal({ id, color, earned, size = 46 }: Props) {
  return (
    <motion.div
      key={earned ? 'on' : 'off'}
      initial={earned ? { scale: 0.4, rotate: -25 } : false}
      animate={earned ? { scale: 1, rotate: 0 } : {}}
      transition={{ type: 'spring', stiffness: 320, damping: 14 }}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg viewBox="0 0 48 48" width={size} height={size}>
        {/* Borda serrilhada do selo */}
        <path
          d={SCALLOP}
          fill={earned ? color : 'rgba(255,255,255,0.05)'}
          stroke={earned ? color : 'rgba(255,255,255,0.14)'}
          strokeWidth="1"
          style={earned ? { filter: `drop-shadow(0 0 6px ${color}aa)` } : undefined}
        />
        {/* Disco interno */}
        <circle
          cx="24" cy="24" r="16.5"
          fill={earned ? 'rgba(4,12,24,0.22)' : 'transparent'}
          stroke={earned ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.12)'}
          strokeWidth="1.2"
          strokeDasharray={earned ? '0' : '3 3'}
        />
        {/* Glifo */}
        <g
          transform="translate(12 12) scale(1)"
          style={{ color: earned ? '#ffffff' : 'rgba(255,255,255,0.3)' }}
        >
          {GLYPHS[id]}
        </g>
      </svg>

      {/* Brilho/estrelinha quando conquistado */}
      {earned && (
        <motion.svg
          width="16" height="16" viewBox="0 0 24 24"
          style={{ position: 'absolute', top: -3, right: -3, color: '#fff' }}
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: [0, 1.2, 1], rotate: [0, 25, 0] }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <path d="M12 2l1.6 5.2L19 8.8l-4.2 3.3L16 18l-4-3-4 3 1.2-5.9L5 8.8l5.4-1.6z" fill="currentColor" />
        </motion.svg>
      )}
    </motion.div>
  );
}

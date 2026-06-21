'use client';

import { motion, AnimatePresence, useMotionValue, useTransform, MotionValue } from 'framer-motion';
import { VoiceStatus } from '@/types';

interface AvatarProps {
  status: VoiceStatus;
  isSpeaking?: boolean;
  /** Amplitude real da voz (0..1) — dirige toda a reatividade do núcleo */
  amplitude?: MotionValue<number>;
  reaction?: 'heart' | 'like' | null;
  reactionKey?: number;
  size?: number;
}

const BAR_COUNT = 56;
// Pesos fixos por barra (sem Math.random no render) — dá textura ao equalizer
const BAR_WEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const a = Math.sin(i * 1.7) * 0.5 + 0.5;
  const b = Math.sin(i * 0.6 + 2) * 0.5 + 0.5;
  return 0.35 + (a * 0.6 + b * 0.4) * 0.65; // 0.35..1.0
});

function themeColor(status: VoiceStatus) {
  switch (status) {
    case 'listening':  return { main: '#00d4ff', soft: '#0088ff' };
    case 'analyzing':  return { main: '#ffb000', soft: '#ff7a00' };
    case 'responding': return { main: '#00ff9d', soft: '#00cc66' };
    default:           return { main: '#2e9bff', soft: '#0066ff' };
  }
}

// ─── Barra reativa do equalizer radial ─────────────────────────────────────────
function Bar({
  angle, weight, amp, color, radius,
}: { angle: number; weight: number; amp: MotionValue<number>; color: string; radius: number }) {
  // altura da barra = base + amplitude * peso
  const h = useTransform(amp, [0, 1], [4, 4 + weight * 30]);
  const op = useTransform(amp, [0, 1], [0.35, 1]);
  return (
    <g transform={`rotate(${angle})`}>
      <motion.rect
        x={-1.4}
        y={-radius}
        width={2.8}
        rx={1.4}
        fill={color}
        style={{ height: h, opacity: op, transformBox: 'fill-box', transformOrigin: 'top' }}
      />
    </g>
  );
}

export default function Avatar({
  status,
  isSpeaking = false,
  amplitude,
  reaction = null,
  reactionKey = 0,
  size = 220,
}: AvatarProps) {
  const fallback = useMotionValue(0);
  const amp = amplitude ?? fallback;

  const { main, soft } = themeColor(status);
  const reactionColor = reaction === 'heart' ? '#ff4d7e' : '#00ff9d';

  // Reatividade derivada da amplitude
  const coreScale   = useTransform(amp, [0, 1], [1, 1.18]);
  const coreOpacity = useTransform(amp, [0, 1], [0.55, 1]);
  const haloScale   = useTransform(amp, [0, 1], [1, 1.35]);
  const haloOpacity = useTransform(amp, [0, 1], [0.15, 0.5]);
  const ringScale   = useTransform(amp, [0, 1], [1, 1.06]);
  const glowBlur    = useTransform(amp, [0, 1], [6, 22]);
  const coreFilter  = useTransform(glowBlur, (b) => `drop-shadow(0 0 ${b}px ${main})`);

  const C = 110; // centro do viewBox 220
  const eqRadius = 70;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Halo externo difuso — respira com a voz */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 0.95, height: size * 0.95,
          background: `radial-gradient(circle, ${main}33 0%, transparent 65%)`,
          scale: haloScale, opacity: haloOpacity,
        }}
      />

      {/* Pulsos concêntricos enquanto fala */}
      <AnimatePresence>
        {isSpeaking && [0, 1, 2].map((i) => (
          <motion.div
            key={`pulse-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{ width: size * 0.7, height: size * 0.7, border: `1.5px solid ${main}` }}
            initial={{ scale: 0.7, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Flash de reação */}
      <AnimatePresence>
        {reaction && (
          <motion.div
            key={`react-ring-${reactionKey}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size * 1.1, height: size * 1.1,
              border: `3px solid ${reactionColor}`,
              boxShadow: `0 0 40px ${reactionColor}aa`,
            }}
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Anel HUD externo girando */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: size * 0.92, height: size * 0.92, border: `1px dashed ${main}44` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: size * 0.78, height: size * 0.78, border: `1px solid ${main}22` }}
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      {/* Núcleo SVG JARVIS */}
      <motion.svg
        viewBox="0 0 220 220"
        width={size * 0.9}
        height={size * 0.9}
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1, scale: ringScale, filter: coreFilter }}
      >
        <defs>
          <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor={main} stopOpacity="0.9" />
            <stop offset="100%" stopColor={soft} stopOpacity="0.15" />
          </radialGradient>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={main} />
            <stop offset="100%" stopColor={soft} />
          </linearGradient>
        </defs>

        {/* Marcações de tick (HUD) */}
        <g opacity={0.5}>
          {Array.from({ length: 60 }, (_, i) => {
            const long = i % 5 === 0;
            return (
              <g key={i} transform={`rotate(${i * 6} ${C} ${C})`}>
                <line
                  x1={C} y1={18} x2={C} y2={long ? 26 : 22}
                  stroke={main} strokeWidth={long ? 1.4 : 0.7}
                  opacity={long ? 0.8 : 0.4}
                />
              </g>
            );
          })}
        </g>

        {/* Arcos rotativos do anel médio */}
        <motion.g
          style={{ transformOrigin: '110px 110px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        >
          <path d="M 110 36 A 74 74 0 0 1 184 110" fill="none" stroke="url(#arcGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <path d="M 110 184 A 74 74 0 0 1 36 110" fill="none" stroke="url(#arcGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        </motion.g>
        <motion.g
          style={{ transformOrigin: '110px 110px' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx={C} cy={42} r="2.6" fill={main} />
          <circle cx={C} cy={178} r="2.6" fill={main} />
        </motion.g>

        {/* Equalizer radial reativo (apontando para dentro) */}
        <g transform={`translate(${C} ${C})`}>
          {BAR_WEIGHTS.map((w, i) => (
            <Bar
              key={i}
              angle={(360 / BAR_COUNT) * i}
              weight={w}
              amp={amp}
              color={main}
              radius={eqRadius}
            />
          ))}
        </g>

        {/* Anel interno do núcleo */}
        <circle cx={C} cy={C} r="34" fill="none" stroke={main} strokeWidth="1.5" opacity="0.6" />

        {/* Núcleo central — arc reactor, pulsa com a amplitude */}
        <motion.circle
          cx={C} cy={C} r="26"
          fill="url(#coreGrad)"
          style={{ scale: coreScale, opacity: coreOpacity, transformBox: 'fill-box', transformOrigin: 'center' }}
        />
        <motion.circle
          cx={C} cy={C} r="12"
          fill="#ffffff"
          style={{ opacity: coreOpacity, scale: coreScale, transformBox: 'fill-box', transformOrigin: 'center' }}
        />

        {/* Scanner durante análise */}
        {status === 'analyzing' && (
          <motion.line
            x1="44" x2="176" stroke={main} strokeWidth="1.5" opacity="0.5"
            animate={{ y1: [50, 170, 50], y2: [50, 170, 50] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Cantos decorativos HUD */}
        <g stroke={main} strokeWidth="1.5" fill="none" opacity="0.45">
          <path d="M 12 12 L 30 12 M 12 12 L 12 30" />
          <path d="M 208 12 L 190 12 M 208 12 L 208 30" />
          <path d="M 12 208 L 30 208 M 12 208 L 12 190" />
          <path d="M 208 208 L 190 208 M 208 208 L 208 190" />
        </g>
      </motion.svg>

      {/* Ícone de reação (sobe e some) */}
      <AnimatePresence>
        {reaction && (
          <motion.div
            key={`react-icon-${reactionKey}`}
            className="absolute pointer-events-none z-20"
            style={{ filter: `drop-shadow(0 0 16px ${reactionColor})` }}
            initial={{ scale: 0, y: 10, opacity: 1 }}
            animate={{ scale: [0, 1.3, 1], y: -size * 0.32, opacity: 0 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
          >
            {reaction === 'heart' ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill={reactionColor}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill={reactionColor}>
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke={reactionColor} strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

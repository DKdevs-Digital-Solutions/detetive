'use client';

import { motion, AnimatePresence, useMotionValue, useTransform, MotionValue } from 'framer-motion';
import { VoiceStatus } from '@/types';

interface AvatarProps {
  status: VoiceStatus;
  isSpeaking?: boolean;
  /** Amplitude real da voz (0..1) — dirige a reatividade do núcleo */
  amplitude?: MotionValue<number>;
  reaction?: 'heart' | 'like' | null;
  reactionKey?: number;
  size?: number;
}

function themeColor(status: VoiceStatus) {
  switch (status) {
    case 'listening':  return { main: '#00d4ff', soft: '#0088ff' };
    case 'analyzing':  return { main: '#ffb000', soft: '#ff7a00' };
    case 'responding': return { main: '#00ff9d', soft: '#00cc66' };
    default:           return { main: '#2e9bff', soft: '#0066ff' };
  }
}

/**
 * Avatar "arc reactor" — versão LEVE para hardware antigo (Intel HD de 2011).
 *
 * Mantém a aparência (núcleo brilhante + anel + HUD), mas remove o que pesava:
 * sem equalizer de 56 barras, sem drop-shadow animado, sem 4 grupos girando.
 * Restam: 1 anel girando (transform composited) e a reatividade do núcleo
 * (scale/opacity), que só recalcula quando a voz toca.
 */
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

  // Reatividade derivada da amplitude (apenas transform/opacity — baratos)
  const coreScale   = useTransform(amp, [0, 1], [1, 1.14]);
  const coreOpacity = useTransform(amp, [0, 1], [0.6, 1]);
  const glowScale   = useTransform(amp, [0, 1], [1, 1.3]);
  const glowOpacity = useTransform(amp, [0, 1], [0.22, 0.6]);

  const C = 110; // centro do viewBox 220

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow reativo (radial-gradient em transform/opacity) */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 0.82, height: size * 0.82,
          background: `radial-gradient(circle, ${main}55 0%, transparent 65%)`,
          scale: glowScale, opacity: glowOpacity,
        }}
      />

      {/* Pulsos concêntricos só enquanto fala (transitório) */}
      <AnimatePresence>
        {isSpeaking && [0, 1].map((i) => (
          <motion.div
            key={`pulse-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{ width: size * 0.62, height: size * 0.62, border: `1.5px solid ${main}` }}
            initial={{ scale: 0.7, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.9, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Flash de reação (transitório) */}
      <AnimatePresence>
        {reaction && (
          <motion.div
            key={`react-ring-${reactionKey}`}
            className="absolute rounded-full pointer-events-none"
            style={{ width: size * 1.05, height: size * 1.05, border: `3px solid ${reactionColor}` }}
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Único anel girando (transform composited — leve) */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: size * 0.9, height: size * 0.9, border: `1px dashed ${main}44` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />

      {/* Núcleo SVG — tudo estático, menos o core reativo */}
      <svg
        viewBox="0 0 220 220"
        width={size * 0.9}
        height={size * 0.9}
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <defs>
          <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor={main} stopOpacity="0.9" />
            <stop offset="100%" stopColor={soft} stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* Marcações de tick reduzidas (12, estáticas) */}
        <g opacity={0.5}>
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i} transform={`rotate(${i * 30} ${C} ${C})`}>
              <line x1={C} y1={18} x2={C} y2={26} stroke={main} strokeWidth={1.2} opacity={0.7} />
            </g>
          ))}
        </g>

        {/* Anéis estáticos */}
        <circle cx={C} cy={C} r="62" fill="none" stroke={`${main}44`} strokeWidth="1" />
        <circle cx={C} cy={C} r="34" fill="none" stroke={main} strokeWidth="1.5" opacity="0.6" />

        {/* Núcleo central — pulsa com a amplitude */}
        <motion.circle
          cx={C} cy={C} r="26"
          fill="url(#coreGrad)"
          style={{ scale: coreScale, opacity: coreOpacity, transformBox: 'fill-box', transformOrigin: 'center' }}
        />
        <motion.circle
          cx={C} cy={C} r="11"
          fill="#ffffff"
          style={{ scale: coreScale, opacity: coreOpacity, transformBox: 'fill-box', transformOrigin: 'center' }}
        />

        {/* Scanner durante análise (transitório) */}
        {status === 'analyzing' && (
          <motion.line
            x1="48" x2="172" stroke={main} strokeWidth="1.5" opacity="0.5"
            animate={{ y1: [60, 160, 60], y2: [60, 160, 60] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Cantos decorativos HUD (estáticos) */}
        <g stroke={main} strokeWidth="1.5" fill="none" opacity="0.4">
          <path d="M 14 14 L 30 14 M 14 14 L 14 30" />
          <path d="M 206 14 L 190 14 M 206 14 L 206 30" />
          <path d="M 14 206 L 30 206 M 14 206 L 14 190" />
          <path d="M 206 206 L 190 206 M 206 206 L 206 190" />
        </g>
      </svg>

      {/* Ícone de reação (sobe e some) */}
      <AnimatePresence>
        {reaction && (
          <motion.div
            key={`react-icon-${reactionKey}`}
            className="absolute pointer-events-none z-20"
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
    </div>
  );
}

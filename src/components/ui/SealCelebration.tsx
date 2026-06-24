'use client';

import { motion } from 'framer-motion';
import { BadgeId } from '@/types';
import { BADGES } from '@/lib/game';
import BadgeSeal from '@/components/ui/BadgeSeal';

interface Props {
  badge: BadgeId;
}

/**
 * Overlay de "fase concluída" — o selo conquistado estoura com brilho.
 * Leve: poucas animações one-shot (sem partículas/loops infinitos pesados).
 * A navegação para a próxima fase é controlada por quem renderiza (page.tsx).
 */
export default function SealCelebration({ badge }: Props) {
  const meta = BADGES.find((b) => b.id === badge);
  const color = meta?.color || '#00d4ff';

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(2,6,16,0.92)' }}
    >
      {/* Raios de luz (estáticos, só giram uma vez na entrada) */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 420, height: 420, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}22 0%, transparent 60%)`,
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      <motion.div
        initial={{ scale: 0.3, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="relative z-10"
      >
        <BadgeSeal id={badge} color={color} earned size={140} />
      </motion.div>

      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <p className="text-2xl sm:text-3xl font-black" style={{ color, textShadow: `0 0 24px ${color}66` }}>
          Selo conquistado!
        </p>
        <p className="text-base sm:text-lg font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
          {meta?.label || 'Fase concluída'}
        </p>
      </motion.div>
    </motion.div>
  );
}

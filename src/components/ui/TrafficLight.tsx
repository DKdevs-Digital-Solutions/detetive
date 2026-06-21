'use client';

import { motion } from 'framer-motion';
import { ConfidenceLevel } from '@/types';

interface TrafficLightProps {
  level: ConfidenceLevel | null;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG = {
  green: {
    color: '#00dd44',
    glow: 'rgba(0, 221, 68, 0.5)',
    bg: 'rgba(0, 221, 68, 0.1)',
    label: 'ALTA CONFIANÇA',
    description: 'Informação parece consistente',
  },
  yellow: {
    color: '#ffaa00',
    glow: 'rgba(255, 170, 0, 0.5)',
    bg: 'rgba(255, 170, 0, 0.1)',
    label: 'ATENÇÃO',
    description: 'Verificação necessária',
  },
  red: {
    color: '#ff3344',
    glow: 'rgba(255, 51, 68, 0.5)',
    bg: 'rgba(255, 51, 68, 0.1)',
    label: 'BAIXA CONFIANÇA',
    description: 'Informação suspeita',
  },
};

const SIZES = {
  sm: { dot: 14, housing: 44, gap: 6 },
  md: { dot: 22, housing: 70, gap: 10 },
  lg: { dot: 32, housing: 100, gap: 14 },
};

export default function TrafficLight({ level, label, size = 'md' }: TrafficLightProps) {
  const s = SIZES[size];
  const lights: ConfidenceLevel[] = ['green', 'yellow', 'red'];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex flex-col items-center rounded-xl p-2"
        style={{
          width: s.housing,
          background: 'rgba(0, 10, 20, 0.8)',
          border: '1px solid rgba(0,212,255,0.15)',
          gap: s.gap,
          paddingTop: s.gap,
          paddingBottom: s.gap,
        }}
      >
        {lights.map((l) => {
          const cfg = CONFIG[l];
          const isActive = level === l;

          return (
            <motion.div
              key={l}
              className="rounded-full relative"
              style={{
                width: s.dot,
                height: s.dot,
                backgroundColor: isActive ? cfg.color : `${cfg.color}22`,
              }}
              animate={
                isActive
                  ? {
                      boxShadow: [
                        `0 0 ${s.dot}px ${cfg.glow}`,
                        `0 0 ${s.dot * 2}px ${cfg.glow}`,
                        `0 0 ${s.dot}px ${cfg.glow}`,
                      ],
                    }
                  : { boxShadow: 'none' }
              }
              transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {level && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div
            className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
            style={{
              color: CONFIG[level].color,
              background: CONFIG[level].bg,
              border: `1px solid ${CONFIG[level].color}44`,
            }}
          >
            {label || CONFIG[level].label}
          </div>
        </motion.div>
      )}
    </div>
  );
}

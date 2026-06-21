'use client';

import { motion } from 'framer-motion';
import { VoiceStatus } from '@/types';

interface VoiceWaveProps {
  status: VoiceStatus;
  color?: string;
}

export default function VoiceWave({ status, color = '#00d4ff' }: VoiceWaveProps) {
  const isActive = status !== 'idle';
  const bars = 12;

  const getBarAnimation = (i: number) => {
    if (status === 'idle') return { scaleY: 0.15 };
    if (status === 'listening') {
      return {
        scaleY: [0.2, 0.8 + Math.random() * 0.6, 0.3, 1, 0.4],
        transition: {
          duration: 0.5 + Math.random() * 0.4,
          repeat: Infinity,
          delay: i * 0.06,
          ease: 'easeInOut',
        },
      };
    }
    if (status === 'analyzing') {
      return {
        scaleY: [0.4, 0.6, 0.4],
        transition: { duration: 0.8, repeat: Infinity, delay: i * 0.07 },
      };
    }
    // responding
    return {
      scaleY: [0.3, 1, 0.5, 0.8, 0.2],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        delay: i * 0.05,
        ease: 'easeInOut',
      },
    };
  };

  const barColor =
    status === 'analyzing' ? '#ffaa00' : status === 'responding' ? '#00dd44' : color;

  return (
    <div className="flex items-center justify-center gap-1" style={{ height: 48 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 4,
            height: 40,
            originY: 0.5,
            backgroundColor: barColor,
            opacity: isActive ? 0.85 : 0.2,
            boxShadow: isActive ? `0 0 8px ${barColor}88` : 'none',
          }}
          animate={getBarAnimation(i)}
          initial={{ scaleY: 0.15 }}
        />
      ))}
    </div>
  );
}

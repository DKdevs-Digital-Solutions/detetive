'use client';

import { Screen } from '@/types';
import { JOURNEY, PHASE_LABELS, journeyIndex } from '@/lib/game';

interface Props {
  current: Screen;
}

/**
 * Barra de progresso da jornada linear ("Fase X de 5" + segmentos).
 * Fica logo abaixo da StatusBar durante as fases. Sem animações pesadas
 * (apenas transições de cor) para rodar leve em hardware antigo.
 */
export default function JourneyProgress({ current }: Props) {
  const idx = journeyIndex(current);
  if (idx < 0) return null;

  const total = JOURNEY.length;

  return (
    <div
      className="shrink-0 px-4 sm:px-6 py-2 flex items-center gap-3"
      style={{ borderBottom: '1px solid rgba(0,212,255,0.1)', background: 'rgba(0,10,25,0.55)' }}
    >
      <span className="text-xs sm:text-sm font-bold whitespace-nowrap" style={{ color: '#00d4ff' }}>
        Fase {idx + 1} de {total}
      </span>

      {/* Segmentos */}
      <div className="flex-1 flex items-center gap-1.5">
        {JOURNEY.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <div
              key={s}
              className="flex-1 h-1.5 rounded-full transition-colors duration-300"
              style={{
                background: done
                  ? '#00dd66'
                  : active
                  ? '#00d4ff'
                  : 'rgba(255,255,255,0.12)',
                boxShadow: active ? '0 0 10px rgba(0,212,255,0.5)' : 'none',
              }}
            />
          );
        })}
      </div>

      <span
        className="text-xs sm:text-sm font-medium whitespace-nowrap max-w-[40%] truncate"
        style={{ color: 'var(--text-secondary)' }}
      >
        {PHASE_LABELS[current] || ''}
      </span>
    </div>
  );
}

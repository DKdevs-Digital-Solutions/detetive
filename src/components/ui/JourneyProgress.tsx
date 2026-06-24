'use client';

import { Screen, BadgeId } from '@/types';
import { JOURNEY, BADGES, journeyIndex } from '@/lib/game';
import BadgeSeal from '@/components/ui/BadgeSeal';
import { useGame } from '@/context/GameProvider';

interface Props {
  current: Screen;
}

const META = (s: Screen) => BADGES.find((b) => b.id === (s as BadgeId));

/**
 * Barra de progresso GAMIFICADA: a fileira de selos (conquistas) que acende
 * conforme o visitante completa cada fase. Leve — os selos só animam quando
 * são conquistados; o resto é estático.
 */
export default function JourneyProgress({ current }: Props) {
  const idx = journeyIndex(current);
  const { badges } = useGame();
  if (idx < 0) return null;

  const total = JOURNEY.length;
  const earned = JOURNEY.filter((s) => badges[s as BadgeId]).length;

  return (
    <div
      className="shrink-0 px-3 sm:px-5 py-2 flex items-center gap-3"
      style={{ borderBottom: '1px solid rgba(0,212,255,0.12)', background: 'rgba(0,10,25,0.6)' }}
    >
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="#ffcc44" strokeWidth="2" />
          <path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5" stroke="#ffcc44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs sm:text-sm font-bold" style={{ color: '#ffcc44' }}>
          {earned}<span style={{ color: 'var(--text-muted)' }}>/{total}</span>
        </span>
      </div>

      <div className="flex-1 flex items-center justify-between">
        {JOURNEY.map((s, i) => {
          const meta = META(s);
          const color = meta?.color || '#00d4ff';
          const got = !!badges[s as BadgeId];
          const active = i === idx;
          return (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className="relative flex items-center justify-center rounded-full"
                style={
                  active
                    ? { padding: 2, boxShadow: `0 0 0 2px ${color}, 0 0 14px ${color}88` }
                    : undefined
                }
              >
                <BadgeSeal id={s as BadgeId} color={color} earned={got} size={active ? 34 : 28} />
              </div>
              {/* Conector entre selos */}
              {i < total - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1 rounded-full"
                  style={{ background: i < idx ? '#00dd66' : 'rgba(255,255,255,0.12)' }}
                />
              )}
            </div>
          );
        })}
      </div>

      <span
        className="text-[11px] sm:text-xs font-medium whitespace-nowrap max-w-[34%] truncate hidden sm:block"
        style={{ color: 'var(--text-secondary)' }}
      >
        {META(current)?.label || ''}
      </span>
    </div>
  );
}

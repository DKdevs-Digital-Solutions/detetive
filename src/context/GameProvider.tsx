'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { BadgeId } from '@/types';
import { BADGE_IDS, emptyBadges } from '@/lib/game';

interface GameState {
  badges: Record<BadgeId, boolean>;
  grantBadge: (id: BadgeId) => void;
  resetJourney: () => void;
  collectedCount: number;
  totalCount: number;
  allComplete: boolean;
  certificateIssued: boolean;
  markCertificateIssued: () => void;
}

const GameContext = createContext<GameState | null>(null);
const STORAGE_KEY = 'detetive_journey_v1';

export function GameProvider({ children }: { children: ReactNode }) {
  const [badges, setBadges] = useState<Record<BadgeId, boolean>>(() => emptyBadges());
  const [certificateIssued, setCertificateIssued] = useState(false);
  const skipFirstPersist = useRef(true);

  // Carrega a jornada salva (persiste a sessão do visitante)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setBadges({ ...emptyBadges(), ...(parsed.badges || {}) });
        setCertificateIssued(!!parsed.certificateIssued);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persiste mudanças. Pula a 1ª execução (montagem) para não sobrescrever
  // com o estado vazio antes do effect de carga aplicar os dados salvos.
  useEffect(() => {
    if (skipFirstPersist.current) {
      skipFirstPersist.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ badges, certificateIssued }));
    } catch {
      /* ignore */
    }
  }, [badges, certificateIssued]);

  const grantBadge = useCallback((id: BadgeId) => {
    setBadges((b) => (b[id] ? b : { ...b, [id]: true }));
  }, []);

  const resetJourney = useCallback(() => {
    setBadges(emptyBadges());
    setCertificateIssued(false);
  }, []);

  const markCertificateIssued = useCallback(() => setCertificateIssued(true), []);

  const collectedCount = BADGE_IDS.filter((id) => badges[id]).length;
  const totalCount = BADGE_IDS.length;
  const allComplete = collectedCount === totalCount;

  return (
    <GameContext.Provider
      value={{
        badges,
        grantBadge,
        resetJourney,
        collectedCount,
        totalCount,
        allComplete,
        certificateIssued,
        markCertificateIssued,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame deve ser usado dentro de GameProvider');
  return ctx;
}

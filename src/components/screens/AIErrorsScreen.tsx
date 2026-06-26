'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/types';
import { AI_ERROR_EXAMPLES, AIERR_INTRO, AIERR_CLOSING, aiErrLine } from '@/data/aiErrors';
import { useGame } from '@/context/GameProvider';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import Avatar from '@/components/ui/Avatar';

interface AIErrorsScreenProps {
  onNavigate: (screen: Screen) => void;
  onAdvance: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Alucinação: '👻',
  'Informação desatualizada': '🕰️',
  'Contexto insuficiente': '❓',
  'Preconceito nos dados': '⚖️',
  'Fonte inexistente': '📭',
};

export default function AIErrorsScreen({ onNavigate, onAdvance }: AIErrorsScreenProps) {
  const { grantBadge } = useGame();
  const { playClip, stop: stopSpeaking, isSpeaking, amplitude } = useElevenLabsSpeech();

  const [opened, setOpened] = useState<Set<number>>(new Set());
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [done, setDone] = useState(false);

  const playingRef = useRef(false);
  const runIdRef = useRef(0);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playClipRef = useRef(playClip);
  useEffect(() => { playClipRef.current = playClip; }, [playClip]);

  const speakAndWait = (id: string, text: string, runId: number) =>
    new Promise<void>((resolve) => {
      if (!playingRef.current || runId !== runIdRef.current) { resolve(); return; }
      let completed = false;
      const finish = () => { if (completed) return; completed = true; resolve(); };
      playClipRef.current(id, text, finish);
    });

  const startNarration = async () => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    playingRef.current = true;
    setPlaying(true);
    setDone(false);
    setOpened(new Set());
    setCurrentIndex(-1);
    stopSpeaking();
    grantBadge('ai-errors'); // selo da jornada (o Detetive está conduzindo)

    await speakAndWait('aierr-intro', AIERR_INTRO, runId);
    if (!playingRef.current || runId !== runIdRef.current) return;

    for (let i = 0; i < AI_ERROR_EXAMPLES.length; i += 1) {
      if (!playingRef.current || runId !== runIdRef.current) return;
      const ex = AI_ERROR_EXAMPLES[i];
      setCurrentIndex(i);
      // Mantém os cartões já abertos abertos (a tela é grande e ajuda a ler).
      setOpened((prev) => { const next = new Set(prev); next.add(ex.id); return next; });
      cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await speakAndWait(`aierr-${i}`, aiErrLine(ex), runId);
      if (!playingRef.current || runId !== runIdRef.current) return;
      // Pausa generosa para dar tempo de LER o exemplo na tela antes de trocar de cartão.
      const readMs = Math.min(7000, Math.max(4000, ex.wrongAnswer.length * 50));
      await new Promise<void>((r) => setTimeout(r, readMs));
    }

    if (!playingRef.current || runId !== runIdRef.current) return;
    setCurrentIndex(-1);
    await speakAndWait('aierr-closing', AIERR_CLOSING, runId);

    if (!playingRef.current || runId !== runIdRef.current) return;
    playingRef.current = false;
    setPlaying(false);
    setDone(true);
  };

  // Avisa o controle remoto: só libera "Continuar" quando a explicação termina.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('detetive:phase-ready', { detail: { ready: done } }));
  }, [done]);

  // Inicia a narração ao abrir a fase.
  useEffect(() => {
    startTimerRef.current = setTimeout(() => { void startNarration(); }, 700);
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      runIdRef.current += 1;
      playingRef.current = false;
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <button onClick={() => onNavigate('home')} className="btn btn-ghost py-2 px-3 text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>A IA Pode Errar?</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>O Detetive explica cada tipo de erro</p>
        </div>
      </div>

      {/* Barra do narrador */}
      <div
        className="px-6 py-2.5 flex items-center gap-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,15,30,0.45)' }}
      >
        <Avatar status={isSpeaking ? 'responding' : 'idle'} isSpeaking={isSpeaking} amplitude={amplitude} size={56} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: isSpeaking ? '#00ff9d' : '#00d4ff' }}>
            {playing ? 'O Detetive está explicando...' : done ? 'Explicação concluída!' : 'Preparando...'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {currentIndex >= 0 ? `Erro ${currentIndex + 1} de ${AI_ERROR_EXAMPLES.length}` : done ? 'Toque em continuar para a próxima fase' : 'Introdução'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* Error cards */}
        <div className="space-y-3">
          {AI_ERROR_EXAMPLES.map((ex, i) => {
            const isOpen = opened.has(ex.id);
            const isCurrent = currentIndex === i;
            return (
              <motion.div
                key={ex.id}
                ref={(el) => { cardRefs.current[i] = el; }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, scale: isCurrent ? 1.01 : 1 }}
                className="rounded-xl overflow-hidden"
                style={{
                  border: `1px solid ${isCurrent ? ex.color : isOpen ? ex.color + '55' : 'rgba(0,212,255,0.12)'}`,
                  background: isOpen ? `${ex.color}08` : 'rgba(0,15,30,0.4)',
                  boxShadow: isCurrent ? `0 0 16px ${ex.color}55` : 'none',
                }}
              >
                <button
                  className="w-full p-4 flex items-center gap-3 text-left"
                  onClick={() => {
                    setOpened((prev) => {
                      const next = new Set(prev);
                      if (next.has(ex.id)) next.delete(ex.id); else next.add(ex.id);
                      return next;
                    });
                    grantBadge('ai-errors');
                  }}
                >
                  <span className="text-2xl">{CATEGORY_ICONS[ex.category] || '⚡'}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold tracking-wider" style={{ color: ex.color }}>
                      {ex.category.toUpperCase()}
                    </p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {ex.question}
                    </p>
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="px-4 pb-4 space-y-3 pt-1">
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,51,68,0.1)', border: '1px solid rgba(255,51,68,0.25)' }}>
                          <p className="text-xs font-bold mb-1" style={{ color: '#ff3344' }}>O que a IA respondeu (ERRADO):</p>
                          <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>&quot;{ex.wrongAnswer}&quot;</p>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(0,221,68,0.08)', border: '1px solid rgba(0,221,68,0.2)' }}>
                          <p className="text-xs font-bold mb-1" style={{ color: '#00dd44' }}>O que é correto:</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{ex.correctAnswer}</p>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(0,50,80,0.3)', border: '1px solid rgba(0,212,255,0.15)' }}>
                          <p className="text-xs font-bold mb-1" style={{ color: '#00d4ff' }}>Por que isso acontece:</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{ex.explanation}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Avançar na jornada */}
      <div
        className="px-6 py-3 flex items-center justify-between shrink-0"
        style={{ borderTop: '1px solid rgba(0,212,255,0.1)', background: 'rgba(3,7,18,0.6)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {done ? 'Pronto para a próxima fase!' : 'O Detetive está explicando...'}
        </p>
        <motion.button
          onClick={onAdvance}
          animate={done ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="btn btn-primary text-sm"
          style={{ padding: '12px 26px', opacity: done ? 1 : 0.85 }}
        >
          Continuar
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

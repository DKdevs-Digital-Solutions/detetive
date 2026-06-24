'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, ConfidenceLevel } from '@/types';
import TrafficLight from '@/components/ui/TrafficLight';
import Avatar from '@/components/ui/Avatar';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import { useGame } from '@/context/GameProvider';
import { NEWS_LESSONS, NEWS_INTRO, NEWS_CLOSING } from '@/data/news';

interface NewsAnalyzerScreenProps {
  onNavigate: (screen: Screen) => void;
  onAdvance: () => void;
  isOnline?: boolean;
}

const LEVEL_COLOR: Record<ConfidenceLevel, string> = { green: '#00dd44', yellow: '#ffaa00', red: '#ff3344' };

export default function NewsAnalyzerScreen({ onNavigate, onAdvance }: NewsAnalyzerScreenProps) {
  const { grantBadge } = useGame();
  const { playClip, stop: stopSpeaking, isSpeaking, amplitude } = useElevenLabsSpeech();

  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
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
    setRevealed(new Set());
    setCurrentIndex(-1);
    stopSpeaking();
    grantBadge('news');

    await speakAndWait('news-intro', NEWS_INTRO, runId);
    if (!playingRef.current || runId !== runIdRef.current) return;

    for (let i = 0; i < NEWS_LESSONS.length; i += 1) {
      if (!playingRef.current || runId !== runIdRef.current) return;
      setCurrentIndex(i);
      setRevealed((prev) => { const next = new Set(prev); next.add(i); return next; });
      cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await speakAndWait(`news-${i}`, NEWS_LESSONS[i].speech, runId);
      if (!playingRef.current || runId !== runIdRef.current) return;
      // Pausa para ler as pistas com calma antes da próxima.
      await new Promise<void>((r) => setTimeout(r, 3500));
    }

    if (!playingRef.current || runId !== runIdRef.current) return;
    setCurrentIndex(-1);
    await speakAndWait('news-closing', NEWS_CLOSING, runId);

    if (!playingRef.current || runId !== runIdRef.current) return;
    playingRef.current = false;
    setPlaying(false);
    setDone(true);
  };

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
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Como farejar uma notícia</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>O semáforo da confiança, com o Detetive</p>
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
            {playing ? 'O Detetive está explicando...' : done ? 'Lição concluída!' : 'Preparando...'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            🟢 confiável · 🟡 atenção · 🔴 suspeito
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {NEWS_LESSONS.map((l, i) => {
          const show = revealed.has(i);
          const isCurrent = currentIndex === i;
          const color = LEVEL_COLOR[l.level];
          return (
            <div
              key={i}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="rounded-xl p-4"
              style={{
                border: `1px solid ${isCurrent ? color : show ? color + '55' : 'rgba(0,212,255,0.12)'}`,
                background: show ? `${color}0c` : 'rgba(0,15,30,0.4)',
                boxShadow: isCurrent ? `0 0 16px ${color}55` : 'none',
                opacity: show ? 1 : 0.55,
              }}
            >
              <div className="flex items-start gap-3">
                {show ? <TrafficLight level={l.level} size="md" /> : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg" style={{ background: 'rgba(0,30,60,0.6)', border: '1px solid rgba(0,212,255,0.2)' }}>?</div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                    &quot;{l.headline}&quot;
                  </p>
                  <AnimatePresence>
                    {show && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
                        <p className="text-xs font-bold mt-2" style={{ color }}>{l.verdict}</p>
                        <ul className="mt-1 space-y-0.5">
                          {l.clues.map((c, k) => (
                            <li key={k} className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                              <span style={{ color }}>•</span> {c}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
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

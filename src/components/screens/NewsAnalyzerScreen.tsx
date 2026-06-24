'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, ConfidenceLevel } from '@/types';
import TrafficLight from '@/components/ui/TrafficLight';
import Avatar from '@/components/ui/Avatar';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import { useGame } from '@/context/GameProvider';

interface NewsAnalyzerScreenProps {
  onNavigate: (screen: Screen) => void;
  onAdvance: () => void;
  isOnline?: boolean;
}

interface Lesson {
  headline: string;
  level: ConfidenceLevel;
  verdict: string;
  clues: string[];
  speech: string;
}

const INTRO =
  'Toda notícia deixa pistas, como num caso de detetive. Eu uso um semáforo da confiança: verde é confiável, amarelo pede atenção, e vermelho é perigo. Vou te mostrar três exemplos. Preste atenção nas pistas.';
const CLOSING =
  'Pegou o jeito? Sempre confira a fonte, a data, e desconfie de títulos exagerados. Na dúvida, não compartilhe. Quando terminar de ler, toque em continuar.';

const LESSONS: Lesson[] = [
  {
    headline: 'URGENTE: Cientistas descobrem fruta que cura TODAS as doenças. Médicos estão chocados!',
    level: 'red',
    verdict: 'Sinal vermelho — provável fake news',
    clues: [
      'Palavras exageradas: URGENTE, cura TODAS, chocados',
      'Promessa milagrosa, boa demais para ser verdade',
      'Nenhuma fonte ou estudo citado',
    ],
    speech:
      'Olha esta manchete: cientistas descobrem uma fruta que cura todas as doenças, e os médicos estão chocados. Percebe o exagero? Palavras como urgente e cura tudo, uma promessa boa demais, e nenhuma fonte. Isso é sinal vermelho, quase certeza de fake news.',
  },
  {
    headline: 'Estudo afirma que ficar acordado até tarde faz mal para a memória.',
    level: 'yellow',
    verdict: 'Sinal amarelo — precisa verificar',
    clues: [
      'Até pode ser verdade, mas...',
      'Qual estudo? Quem fez? Em que ano?',
      'Sem fonte clara para a gente conferir',
    ],
    speech:
      'Agora esta: um estudo afirma que ficar acordado até tarde faz mal para a memória. Pode até ser verdade, mas qual estudo é esse? Quem fez? Quando? Faltam informações para confirmar. Isso é sinal amarelo: pesquise mais antes de acreditar.',
  },
  {
    headline: 'Segundo a Fiocruz, em 2024, a vacinação reduziu os casos de sarampo no Brasil.',
    level: 'green',
    verdict: 'Sinal verde — boa cara de confiável',
    clues: [
      'Fonte confiável citada: Fiocruz',
      'Tem data: 2024',
      'Linguagem calma e equilibrada, sem exageros',
    ],
    speech:
      'E esta: segundo a Fiocruz, em 2024, a vacinação reduziu os casos de sarampo no Brasil. Aqui temos uma fonte confiável, uma data, e linguagem tranquila, sem exageros. Isso é sinal verde, com boa cara de confiável. Mesmo assim, sempre vale conferir.',
  },
];

const LEVEL_COLOR: Record<ConfidenceLevel, string> = { green: '#00dd44', yellow: '#ffaa00', red: '#ff3344' };

export default function NewsAnalyzerScreen({ onNavigate, onAdvance }: NewsAnalyzerScreenProps) {
  const { grantBadge } = useGame();
  const { speak, stop: stopSpeaking, isSpeaking, amplitude } = useElevenLabsSpeech();

  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);

  const playingRef = useRef(false);
  const runIdRef = useRef(0);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const speakRef = useRef(speak);
  useEffect(() => { speakRef.current = speak; }, [speak]);

  const speakAndWait = (text: string, runId: number) =>
    new Promise<void>((resolve) => {
      if (!playingRef.current || runId !== runIdRef.current) { resolve(); return; }
      let completed = false;
      const finish = () => { if (completed) return; completed = true; resolve(); };
      speakRef.current(text, finish);
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

    await speakAndWait(INTRO, runId);
    if (!playingRef.current || runId !== runIdRef.current) return;

    for (let i = 0; i < LESSONS.length; i += 1) {
      if (!playingRef.current || runId !== runIdRef.current) return;
      setCurrentIndex(i);
      setRevealed((prev) => { const next = new Set(prev); next.add(i); return next; });
      cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await speakAndWait(LESSONS[i].speech, runId);
      if (!playingRef.current || runId !== runIdRef.current) return;
      // Pausa para ler as pistas com calma antes da próxima.
      await new Promise<void>((r) => setTimeout(r, 3500));
    }

    if (!playingRef.current || runId !== runIdRef.current) return;
    setCurrentIndex(-1);
    await speakAndWait(CLOSING, runId);

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
        {LESSONS.map((l, i) => {
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

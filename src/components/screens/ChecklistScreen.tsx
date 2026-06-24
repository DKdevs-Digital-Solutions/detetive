'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Screen } from '@/types';
import { useGame } from '@/context/GameProvider';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import Avatar from '@/components/ui/Avatar';
import { CHECKLIST_ITEMS, CHECKLIST_INTRO, CHECKLIST_CLOSING } from '@/data/checklist';

interface ChecklistScreenProps {
  onNavigate: (screen: Screen) => void;
  onAdvance: () => void;
}

export default function ChecklistScreen({ onNavigate, onAdvance }: ChecklistScreenProps) {
  const { grantBadge } = useGame();
  const { playClip, stop: stopSpeaking, isSpeaking, amplitude } = useElevenLabsSpeech();

  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [narrationStage, setNarrationStage] = useState<'intro' | 'criteria' | 'closing' | 'done'>('intro');

  const playingRef = useRef(false);
  const runIdRef = useRef(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mantém a versão mais recente da função de voz sem reiniciar a sequência.
  const playClipRef = useRef(playClip);
  useEffect(() => { playClipRef.current = playClip; }, [playClip]);

  // Selo da jornada: concedido ao avaliar metade ou mais dos critérios.
  useEffect(() => {
    if (checked.size >= 5) grantBadge('checklist');
  }, [checked, grantBadge]);

  const speakAndWait = (id: string, text: string, runId: number) =>
    new Promise<void>((resolve) => {
      if (!playingRef.current || runId !== runIdRef.current) {
        resolve();
        return;
      }

      let completed = false;
      const finish = () => {
        if (completed) return;
        completed = true;
        resolve();
      };

      // O próximo trecho só é liberado pelo callback real de término do áudio.
      playClipRef.current(id, text, finish);
    });

  const startNarration = async () => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    playingRef.current = true;
    setPlaying(true);
    setChecked(new Set());
    setCurrentIndex(-1);
    setNarrationStage('intro');
    stopSpeaking();

    await speakAndWait('checklist-intro', CHECKLIST_INTRO, runId);
    if (!playingRef.current || runId !== runIdRef.current) return;

    setNarrationStage('criteria');

    for (let i = 0; i < CHECKLIST_ITEMS.length; i += 1) {
      if (!playingRef.current || runId !== runIdRef.current) return;

      const item = CHECKLIST_ITEMS[i];
      setCurrentIndex(i);
      setChecked((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      itemRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      await speakAndWait(`checklist-${i}`, `${item.question} ${item.detail}`, runId);
      if (!playingRef.current || runId !== runIdRef.current) return;

      // Pausa para dar tempo de ler o critério antes do próximo áudio.
      await new Promise<void>((resolve) => setTimeout(resolve, 1800));
    }

    if (!playingRef.current || runId !== runIdRef.current) return;
    setCurrentIndex(-1);
    setNarrationStage('closing');
    await speakAndWait('checklist-closing', CHECKLIST_CLOSING, runId);

    if (!playingRef.current || runId !== runIdRef.current) return;
    playingRef.current = false;
    setPlaying(false);
    setNarrationStage('done');
  };

  // Inicia sozinho ao abrir a tela. A introdução é sempre o primeiro áudio.
  useEffect(() => {
    startTimerRef.current = setTimeout(() => { void startNarration(); }, 900);
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      runIdRef.current += 1;
      playingRef.current = false;
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const count = checked.size;
  const pct = Math.round((count / CHECKLIST_ITEMS.length) * 100);
  const verdict =
    count >= 8
      ? { text: 'Informação parece confiável!', color: '#00dd44' }
      : count >= 5
      ? { text: 'Verifique mais antes de compartilhar.', color: '#ffaa00' }
      : { text: 'Muitos sinais suspeitos. Não compartilhe!', color: '#ff3344' };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <button onClick={() => onNavigate('home')} className="btn btn-ghost py-2 px-3 text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Checklist Anti-Fake News</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>O Detetive marca cada ponto enquanto explica</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${verdict.color}88, ${verdict.color})` }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-sm font-mono font-bold" style={{ color: verdict.color, minWidth: 32 }}>
            {count}/10
          </span>
        </div>
      </div>

      {/* Barra do narrador */}
      <div
        className="px-6 py-2.5 flex items-center gap-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,15,30,0.45)' }}
      >
        <Avatar status={isSpeaking ? 'responding' : 'idle'} isSpeaking={isSpeaking} amplitude={amplitude} size={60} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: isSpeaking ? '#00ff9d' : '#00d4ff' }}>
            {playing ? 'O Detetive está explicando...' : 'Explicação concluída'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {narrationStage === 'intro'
              ? 'Introdução — ouvindo o texto inicial completo'
              : currentIndex >= 0
              ? `Critério ${currentIndex + 1} de 10`
              : narrationStage === 'closing'
              ? 'Conclusão do checklist'
              : narrationStage === 'done'
              ? 'O Detetive marcou cada ponto de verificação'
              : 'Preparando...'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {CHECKLIST_ITEMS.map((item, i) => {
            const isChecked = checked.has(item.id);
            const isCurrent = currentIndex === i;
            return (
              <motion.button
                key={item.id}
                ref={(el) => { itemRefs.current[i] = el; }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0, scale: isCurrent ? 1.02 : 1 }}
                transition={{ delay: playing ? 0 : i * 0.04 }}
                onClick={() => toggle(item.id)}
                className="w-full p-3 rounded-xl text-left flex items-start gap-3 transition-all duration-200"
                style={{
                  background: isCurrent ? 'rgba(0,212,255,0.12)' : isChecked ? 'rgba(0,221,68,0.1)' : 'rgba(0,20,40,0.3)',
                  border: `1px solid ${isCurrent ? '#00d4ff' : isChecked ? 'rgba(0,221,68,0.4)' : 'rgba(0,212,255,0.12)'}`,
                  boxShadow: isCurrent ? '0 0 16px rgba(0,212,255,0.35)' : 'none',
                }}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: isChecked ? '#00dd44' : 'rgba(0,212,255,0.1)',
                    border: `1px solid ${isChecked ? '#00dd44' : 'rgba(0,212,255,0.3)'}`,
                  }}
                >
                  {isChecked && (
                    <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: isChecked ? '#00dd44' : 'var(--text-primary)' }}>
                    {item.id}. {item.question}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.detail}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer verdict */}
      <div
        className="px-6 py-3 flex items-center justify-between shrink-0"
        style={{ borderTop: '1px solid rgba(0,212,255,0.1)', background: 'rgba(3,7,18,0.6)' }}
      >
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Veredicto ({count} de 10 critérios):</p>
          <motion.p
            className="text-sm font-bold"
            style={{ color: verdict.color }}
            animate={{ opacity: [0.8, 1] }}
            key={verdict.text}
          >
            {verdict.text}
          </motion.p>
        </div>
        <button onClick={onAdvance} className="btn btn-primary text-sm py-2 px-5">
          Continuar
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

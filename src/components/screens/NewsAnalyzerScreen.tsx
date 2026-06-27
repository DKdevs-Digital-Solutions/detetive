'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, ConfidenceLevel } from '@/types';
import TrafficLight from '@/components/ui/TrafficLight';
import Avatar from '@/components/ui/Avatar';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import { pickNewsCases, newsCasePrompt } from '@/data/news';
import { FB_RIGHT, FB_WRONG } from '@/data/narration';

interface NewsAnalyzerScreenProps {
  onNavigate: (screen: Screen) => void;
  isOnline?: boolean;
  controlCode: string; // a votação acontece no celular
}

const LEVELS: { level: ConfidenceLevel; label: string; emoji: string; color: string }[] = [
  { level: 'green', label: 'Confiável', emoji: '🟢', color: '#00dd44' },
  { level: 'yellow', label: 'Atenção', emoji: '🟡', color: '#ffaa00' },
  { level: 'red', label: 'Suspeita', emoji: '🔴', color: '#ff3344' },
];

export default function NewsAnalyzerScreen({ onNavigate, controlCode }: NewsAnalyzerScreenProps) {
  const { playClip, stop: stopSpeaking, isSpeaking, amplitude } = useElevenLabsSpeech();

  // Sorteia 1 caso de cada nível ao montar — estável durante toda a sessão.
  const [session] = useState(() => pickNewsCases(3));
  const total = session.length;
  const [caseIndex, setCaseIndex] = useState(0);
  const [canVote, setCanVote] = useState(false);
  const [selected, setSelected] = useState<ConfidenceLevel | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  // Protege contra índice fora dos limites (mensagens duplicadas do controle
  // poderiam avançar caseIndex além do último caso e deixar current undefined).
  const safeIndex = Math.min(caseIndex, total - 1);
  const current = session[safeIndex];
  const isCorrect = revealed && !!current && selected === current.level;

  const playRef = useRef(playClip);
  useEffect(() => { playRef.current = playClip; }, [playClip]);
  const spokenRef = useRef(-1); // armazena o id estável do caso já narrado

  // Lê o caso (clip com id estável do pool); libera o voto ao terminar.
  useEffect(() => {
    if (done) return;
    if (!current) return;
    if (spokenRef.current === current.id) return;
    spokenRef.current = current.id;
    setSelected(null);
    setRevealed(false);
    setCanVote(false);
    let unlocked = false;
    const unlock = () => { if (!unlocked) { unlocked = true; setCanVote(true); } };
    playRef.current(`news-case-${current.id}`, newsCasePrompt(current), unlock);
    const safety = setTimeout(unlock, 14000);
    return () => clearTimeout(safety);
  }, [caseIndex, done, current]);

  // Para a fala ao sair da fase.
  useEffect(() => () => { stopSpeaking(); }, [stopSpeaking]);

  // Avisa o controle: só libera "Continuar" quando todos os casos foram resolvidos.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('detetive:phase-ready', { detail: { ready: done } }));
  }, [done]);

  const handleVote = (level: ConfidenceLevel) => {
    if (!canVote || selected !== null || done || !current) return;
    setSelected(level);
    setRevealed(true);
    stopSpeaking();
    const acerto = level === current.level;
    const caseId = current.id;
    const speech = current.speech;
    const idx = caseIndex;
    const t = total;
    // Feedback → explicação → auto-avança para o próximo caso.
    playRef.current(acerto ? 'fb-right' : 'fb-wrong', acerto ? FB_RIGHT : FB_WRONG, () => {
      playRef.current(`news-${caseId}`, speech, () => {
        setTimeout(() => {
          if (idx < t - 1) setCaseIndex((i) => i + 1);
          else { stopSpeaking(); setDone(true); }
        }, 1200);
      });
    });
  };

  // Mantido como fallback caso o áudio falhe e o celular precise avançar manualmente.
  const handleNext = () => {
    if (!revealed) return;
    if (caseIndex < total - 1) setCaseIndex((i) => i + 1);
    else { stopSpeaking(); setDone(true); }
  };

  // Espelha o estado para o celular (quem vota).
  useEffect(() => {
    if (!controlCode) return;
    const payload = {
      caseIndex,
      total,
      canVote,
      selected,
      revealed,
      correctLevel: revealed && current ? current.level : null,
      done,
    };
    fetch('/api/control/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: controlCode, command: { from: 'display', type: 'news-state', news: payload } }),
    }).catch(() => {});
  }, [controlCode, caseIndex, total, canVote, selected, revealed, done, current?.level]);

  // Recebe as ações do celular (votar, próximo caso).
  const actionsRef = useRef<(a: string, level?: ConfidenceLevel) => void>(() => {});
  useEffect(() => {
    actionsRef.current = (action: string, level?: ConfidenceLevel) => {
      if (action === 'vote' && level) handleVote(level);
      else if (action === 'next') handleNext();
    };
  });
  useEffect(() => {
    const onNews = (e: Event) => {
      const d = (e as CustomEvent<{ action?: string; level?: ConfidenceLevel }>).detail || {};
      actionsRef.current(d.action || '', d.level);
    };
    window.addEventListener('detetive:news', onNews);
    return () => window.removeEventListener('detetive:news', onNews);
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
        <div className="flex-1">
          <h2 className="text-base lg:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Investigue a notícia</h2>
          <p className="text-xs lg:text-sm" style={{ color: 'var(--text-muted)' }}>Você é o detetive — dê o seu veredito pelo celular</p>
        </div>
        {!done && (
          <span className="text-sm lg:text-base font-mono" style={{ color: '#00d4ff' }}>Caso {caseIndex + 1}/{total}</span>
        )}
      </div>

      {/* Barra do narrador */}
      <div className="px-6 py-2.5 flex items-center gap-4 shrink-0" style={{ borderBottom: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,15,30,0.45)' }}>
        <Avatar status={isSpeaking ? 'responding' : 'idle'} isSpeaking={isSpeaking} amplitude={amplitude} size={56} />
        <div className="flex-1 min-w-0">
          <p className="text-sm lg:text-base font-semibold" style={{ color: isSpeaking ? '#00ff9d' : '#00d4ff' }}>
            {done ? 'Casos encerrados!' : revealed ? 'Veredito do Detetive' : canVote ? 'Qual o seu veredito?' : 'O Detetive está lendo o caso...'}
          </p>
          <p className="text-xs lg:text-sm" style={{ color: 'var(--text-muted)' }}>
            🟢 confiável · 🟡 atenção · 🔴 suspeito
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-5 lg:p-10 flex flex-col items-center justify-center">
        {done || !current ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-2xl">
            <div className="text-6xl lg:text-7xl mb-4">🕵️</div>
            <h3 className="text-2xl lg:text-4xl font-bold mb-3" style={{ color: '#00d4ff' }}>Casos resolvidos!</h3>
            <p className="text-base lg:text-xl" style={{ color: 'var(--text-secondary)' }}>
              Você farejou as pistas: fonte, data e exageros. Continue a investigação pelo seu celular.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={caseIndex}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="w-full max-w-3xl flex flex-col items-center gap-6"
            >
              {/* Manchete do caso */}
              <div
                className="w-full rounded-2xl p-6 lg:p-9 text-center"
                style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.2)' }}
              >
                <p className="text-xs lg:text-sm uppercase tracking-[0.2em] mb-3" style={{ color: 'rgba(0,212,255,0.7)' }}>
                  Caso {caseIndex + 1} de {total}
                </p>
                <p className="text-xl lg:text-3xl font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  &ldquo;{current.headline}&rdquo;
                </p>
              </div>

              {!revealed ? (
                /* Aguardando o voto (no celular) — legenda dos sinais */
                <div className="flex items-center gap-4 lg:gap-6">
                  {LEVELS.map((l) => (
                    <div key={l.level} className="flex flex-col items-center gap-1" style={{ opacity: canVote ? 1 : 0.45 }}>
                      <span className="text-3xl lg:text-4xl">{l.emoji}</span>
                      <span className="text-xs lg:text-base font-semibold" style={{ color: l.color }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Veredito revelado */
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="w-full rounded-2xl p-6 lg:p-8 flex flex-col items-center gap-4"
                  style={{ background: `${LEVELS.find((l) => l.level === current.level)?.color}12`, border: `1px solid ${LEVELS.find((l) => l.level === current.level)?.color}55` }}
                >
                  <div className="flex items-center gap-4">
                    <TrafficLight level={current.level} size="md" />
                    <div className="text-left">
                      <p className="text-lg lg:text-2xl font-bold" style={{ color: LEVELS.find((l) => l.level === current.level)?.color }}>
                        {current.verdict}
                      </p>
                      <p className="text-sm lg:text-lg font-semibold" style={{ color: isCorrect ? '#00dd44' : '#ffaa00' }}>
                        {isCorrect ? 'Você acertou o veredito! 🎉' : 'Olho vivo da próxima vez!'}
                      </p>
                    </div>
                  </div>
                  <ul className="w-full max-w-xl space-y-1.5">
                    {current.clues.map((c, k) => (
                      <li key={k} className="text-sm lg:text-lg flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: LEVELS.find((l) => l.level === current.level)?.color }}>•</span> {c}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              <p className="text-sm lg:text-base font-semibold flex items-center gap-2" style={{ color: '#00d4ff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {revealed
                  ? (caseIndex < total - 1 ? 'Toque em "Próximo caso" no celular' : 'Toque em "Concluir" no celular')
                  : canVote ? 'Dê o seu veredito no celular' : 'Aguarde o Detetive ler o caso...'}
              </p>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

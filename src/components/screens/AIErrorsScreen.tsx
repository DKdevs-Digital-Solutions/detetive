'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/types';
import { AI_JUDGE_CASES, judgeCasePrompt, judgeRevealLine, AIERR_INTRO } from '@/data/aiErrors';
import { FB_RIGHT, FB_WRONG } from '@/data/narration';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import Avatar from '@/components/ui/Avatar';

interface AIErrorsScreenProps {
  onNavigate: (screen: Screen) => void;
  controlCode: string; // o veredito é dado no celular
}

export default function AIErrorsScreen({ onNavigate, controlCode }: AIErrorsScreenProps) {
  const { playClip, stop: stopSpeaking, isSpeaking, amplitude } = useElevenLabsSpeech();

  const total = AI_JUDGE_CASES.length;
  const [introPlayed, setIntroPlayed] = useState(false);
  const [caseIndex, setCaseIndex] = useState(0);
  const [canVote, setCanVote] = useState(false);
  const [selected, setSelected] = useState<boolean | null>(null); // true = "acertou", false = "errou"
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  const current = AI_JUDGE_CASES[caseIndex];
  const isCorrect = revealed && selected === current.aiCorrect;

  const playRef = useRef(playClip);
  useEffect(() => { playRef.current = playClip; }, [playClip]);
  const spokenRef = useRef(-1);

  // Intro narrada: explica a fase antes de começar os casos.
  useEffect(() => {
    const t = setTimeout(() => {
      playRef.current('aierr-intro', AIERR_INTRO, () => setIntroPlayed(true));
    }, 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lê o caso (áudio pré-gravado); libera o voto ao terminar.
  // Aguarda o intro terminar antes de iniciar.
  useEffect(() => {
    if (!introPlayed) return;
    if (done) return;
    if (spokenRef.current === caseIndex) return;
    spokenRef.current = caseIndex;
    setSelected(null);
    setRevealed(false);
    setCanVote(false);
    const c = AI_JUDGE_CASES[caseIndex];
    let unlocked = false;
    const unlock = () => { if (!unlocked) { unlocked = true; setCanVote(true); } };
    playRef.current(`judge-case-${caseIndex}`, judgeCasePrompt(c, caseIndex), unlock);
    const safety = setTimeout(unlock, 16000);
    return () => clearTimeout(safety);
  }, [caseIndex, done, introPlayed]);

  useEffect(() => () => { stopSpeaking(); }, [stopSpeaking]);

  // Avisa o controle: só libera "Continuar" quando todos os casos forem julgados.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('detetive:phase-ready', { detail: { ready: done } }));
  }, [done]);

  const handleVote = (verdict: boolean) => {
    if (!canVote || selected !== null || done) return;
    setSelected(verdict);
    setRevealed(true);
    stopSpeaking();
    const acerto = verdict === current.aiCorrect;
    const idx = caseIndex;
    const t = total;
    // Feedback → revelação → auto-avança para o próximo caso.
    playRef.current(acerto ? 'fb-right' : 'fb-wrong', acerto ? FB_RIGHT : FB_WRONG, () => {
      playRef.current(`judge-reveal-${idx}`, judgeRevealLine(AI_JUDGE_CASES[idx]), () => {
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

  // Espelha o estado para o celular (quem julga).
  useEffect(() => {
    if (!controlCode) return;
    const payload = {
      caseIndex,
      total,
      canVote,
      selected,
      revealed,
      aiCorrect: revealed ? current.aiCorrect : null,
      done,
    };
    fetch('/api/control/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: controlCode, command: { from: 'display', type: 'aierr-state', aierr: payload } }),
    }).catch(() => {});
  }, [controlCode, caseIndex, total, canVote, selected, revealed, done, current.aiCorrect]);

  // Recebe as ações do celular (julgar, próximo caso).
  const actionsRef = useRef<(a: string, value?: boolean) => void>(() => {});
  useEffect(() => {
    actionsRef.current = (action: string, value?: boolean) => {
      if (action === 'vote' && typeof value === 'boolean') handleVote(value);
      else if (action === 'next') handleNext();
    };
  });
  useEffect(() => {
    const onAierr = (e: Event) => {
      const d = (e as CustomEvent<{ action?: string; value?: boolean }>).detail || {};
      actionsRef.current(d.action || '', d.value);
    };
    window.addEventListener('detetive:aierr', onAierr);
    return () => window.removeEventListener('detetive:aierr', onAierr);
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
          <h2 className="text-base lg:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>A IA acertou ou errou?</h2>
          <p className="text-xs lg:text-sm" style={{ color: 'var(--text-muted)' }}>Você é o detetive — julgue a resposta da IA pelo celular</p>
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
            {done ? 'Casos encerrados!' : revealed ? 'Veredito do Detetive' : canVote ? 'A IA acertou ou errou?' : 'O Detetive está lendo o caso...'}
          </p>
          <p className="text-xs lg:text-sm" style={{ color: 'var(--text-muted)' }}>
            A IA ajuda muito, mas nem sempre acerta.
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-5 lg:p-10 flex flex-col items-center justify-center">
        {done ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-2xl">
            <div className="text-6xl lg:text-7xl mb-4">🤖</div>
            <h3 className="text-2xl lg:text-4xl font-bold mb-3" style={{ color: '#00d4ff' }}>Investigação concluída!</h3>
            <p className="text-base lg:text-xl" style={{ color: 'var(--text-secondary)' }}>
              A IA é uma ótima ajudante, mas não substitui o seu pensamento. Sempre confira o que ela diz. Continue pelo celular.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={caseIndex}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="w-full max-w-3xl flex flex-col items-center gap-5"
            >
              <p className="text-xs lg:text-sm uppercase tracking-[0.2em]" style={{ color: 'rgba(0,212,255,0.7)' }}>
                Caso {caseIndex + 1} de {total}
              </p>

              {/* Pergunta */}
              <div className="w-full flex justify-end">
                <div
                  className="px-5 py-3 rounded-2xl text-base lg:text-xl max-w-[80%]"
                  style={{ background: 'rgba(0,100,255,0.22)', border: '1px solid rgba(0,100,255,0.4)', color: 'var(--text-primary)', borderBottomRightRadius: 4 }}
                >
                  {current.question}
                </div>
              </div>

              {/* Resposta da IA */}
              <div className="w-full flex gap-3 items-start">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shrink-0 text-xl" style={{ background: 'rgba(0,100,200,0.3)', border: '1px solid #0066ff55' }}>
                  🤖
                </div>
                <div
                  className="px-5 py-4 rounded-2xl text-base lg:text-2xl leading-relaxed"
                  style={{ background: 'rgba(0,30,60,0.6)', border: '1px solid rgba(0,212,255,0.2)', color: 'var(--text-primary)', borderBottomLeftRadius: 4 }}
                >
                  {current.answer}
                </div>
              </div>

              {/* Reveal */}
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="w-full rounded-2xl p-5 lg:p-7 flex flex-col gap-2"
                  style={{ background: `${current.color}12`, border: `1px solid ${current.color}55` }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl lg:text-3xl">{current.aiCorrect ? '✅' : '❌'}</span>
                    <span className="text-lg lg:text-2xl font-bold" style={{ color: current.color }}>
                      A IA {current.aiCorrect ? 'acertou' : 'errou'} — {current.tag}
                    </span>
                    <span className="text-sm lg:text-lg font-semibold ml-auto" style={{ color: isCorrect ? '#00dd44' : '#ffaa00' }}>
                      {isCorrect ? 'Você acertou o veredito! 🎉' : 'Olho vivo da próxima!'}
                    </span>
                  </div>
                  <p className="text-sm lg:text-lg" style={{ color: 'var(--text-secondary)' }}>{current.explanation}</p>
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

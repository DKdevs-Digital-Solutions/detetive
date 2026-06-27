'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, QuizQuestion } from '@/types';
import { pickQuizQuestions } from '@/data/quiz';
import { FB_RIGHT, FB_WRONG } from '@/data/narration';
import { useGame } from '@/context/GameProvider';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';

interface QuizScreenProps {
  onNavigate: (screen: Screen) => void;
  controlCode: string; // sala da sessão — o quiz é respondido pelo celular
}

type QuizState = 'intro' | 'question' | 'analyzing' | 'result';

// Sorteia 5 perguntas do pool de 20, com opções embaralhadas.

export default function QuizScreen({ onNavigate, controlCode }: QuizScreenProps) {
  const { grantBadge } = useGame();
  const { playClip, stop: stopSpeaking } = useElevenLabsSpeech();
  const playRef = useRef(playClip);
  const [deck, setDeck] = useState<QuizQuestion[]>(() => pickQuizQuestions(5));
  const [state, setState] = useState<QuizState>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(deck.length).fill(null));
  const [canAnswer, setCanAnswer] = useState(false);
  // Bloqueia "Próxima" enquanto o áudio de feedback + explicação ainda toca.
  const [isExplaining, setIsExplaining] = useState(false);

  const question = deck[currentQ];
  const progress = ((currentQ) / deck.length) * 100;

  const spokenQRef = useRef(-1);
  useEffect(() => { playRef.current = playClip; }, [playClip]);
  // Ref estável para auto-avançar sem closure velha.
  const handleNextRef = useRef(() => {});

  // O Detetive lê a PERGUNTA (clip com id estável); as opções aparecem na tela.
  // Só libera as respostas ao terminar de ler.
  useEffect(() => {
    if (state === 'question' && question && spokenQRef.current !== question.id) {
      spokenQRef.current = question.id;
      setCanAnswer(false);
      let unlocked = false;
      const unlock = () => { if (!unlocked) { unlocked = true; setCanAnswer(true); } };
      playRef.current(`quiz-q-${question.id}`, question.question, unlock);
      const safety = setTimeout(unlock, 15000);
      return () => clearTimeout(safety);
    }
  }, [state, currentQ, question]);

  // Para a fala ao sair da fase.
  useEffect(() => () => { stopSpeaking(); }, [stopSpeaking]);

  // Avisa o controle remoto: só libera "Continuar" ao chegar no resultado do quiz.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('detetive:phase-ready', { detail: { ready: state === 'result' } }));
  }, [state]);

  const handleSelect = (idx: number) => {
    if (selected !== null || !canAnswer) return;
    setSelected(idx);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
    const correct = idx === question.correct;
    if (correct) setScore((s) => s + 1);
    const qid = question.id;
    const exp = question.explanation;
    // Bloqueia próxima; feedback → explicação → auto-avança.
    setIsExplaining(true);
    playRef.current(correct ? 'fb-right' : 'fb-wrong', correct ? FB_RIGHT : FB_WRONG, () => {
      playRef.current(`quiz-exp-${qid}`, exp, () => {
        setIsExplaining(false);
        setTimeout(() => handleNextRef.current(), 1500);
      });
    });
  };

  const handleNext = () => {
    setSelected(null);
    setIsExplaining(false);
    if (currentQ < deck.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      setState('analyzing');
    }
  };

  // Mantém o ref sempre atualizado.
  useEffect(() => { handleNextRef.current = handleNext; });

  // "Analisando" → resultado (com o selo e o registro estatístico).
  useEffect(() => {
    if (state !== 'analyzing') return;
    const t = setTimeout(() => {
      setState('result');
      grantBadge('quiz');
      fetch('/api/log', {
        method: 'POST',
        body: JSON.stringify({ type: 'quiz', score: Math.round((score / deck.length) * 100) }),
      }).catch(() => {});
    }, 2200);
    return () => clearTimeout(t);
  }, [state, grantBadge, score, deck.length]);

  const handleRestart = () => {
    stopSpeaking();
    spokenQRef.current = -1;
    setCanAnswer(false);
    setDeck(pickQuizQuestions(5)); // novo sorteio de 5 perguntas
    setState('intro');
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setAnswers(Array(deck.length).fill(null));
  };

  const pct = Math.round((score / deck.length) * 100);
  const resultMsg =
    pct >= 80
      ? 'Excelente! Você é um verdadeiro Detetive IA!'
      : pct >= 60
      ? 'Bom trabalho! Continue aprendendo sobre IA e fake news.'
      : 'Continue estudando — o pensamento crítico é fundamental!';

  const resultColor = pct >= 80 ? '#00dd44' : pct >= 60 ? '#ffaa00' : '#ff3344';

  // Espelha o estado do quiz para o celular (que é quem responde).
  useEffect(() => {
    if (!controlCode) return;
    const q = deck[currentQ];
    const payload = {
      state,
      index: currentQ,
      total: deck.length,
      question: q?.question ?? '',
      options: q?.options ?? [],
      canAnswer,
      selected,
      correct: selected !== null ? q?.correct ?? -1 : -1,
      explanation: selected !== null ? q?.explanation ?? '' : '',
      score,
      pct,
      isExplaining,
    };
    fetch('/api/control/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: controlCode, command: { from: 'display', type: 'quiz-state', quiz: payload } }),
    }).catch(() => {});
  }, [controlCode, state, currentQ, canAnswer, selected, score, pct, deck, isExplaining]);

  // Recebe as ações do celular (responder, próxima, jogar de novo).
  const quizActionsRef = useRef<(a: string, idx?: number) => void>(() => {});
  useEffect(() => {
    quizActionsRef.current = (action: string, idx?: number) => {
      if (action === 'start') setState('question');
      else if (action === 'select' && typeof idx === 'number') handleSelect(idx);
      // Bloqueia "próxima" enquanto o áudio de explicação ainda toca.
      else if (action === 'next' && !isExplaining) handleNext();
      else if (action === 'restart') handleRestart();
    };
  });
  useEffect(() => {
    const onQuiz = (e: Event) => {
      const d = (e as CustomEvent<{ action?: string; idx?: number }>).detail || {};
      quizActionsRef.current(d.action || '', d.idx);
    };
    window.addEventListener('detetive:quiz', onQuiz);
    return () => window.removeEventListener('detetive:quiz', onQuiz);
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
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Quiz Interativo</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>5 perguntas sortidas de um banco de 20</p>
        </div>

        {state === 'question' && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-mono" style={{ color: '#00d4ff' }}>
              {currentQ + 1}/{deck.length}
            </span>
            <div className="w-32 h-2 rounded-full" style={{ background: 'rgba(0,212,255,0.15)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00d4ff, #0066ff)' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Intro */}
        {state === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-6 text-center"
          >
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(136,85,255,0.2)', border: '1px solid rgba(136,85,255,0.4)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#8855ff" strokeWidth="2" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="#8855ff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Quiz Detetive IA</h3>
              <p className="text-sm leading-relaxed max-w-md" style={{ color: 'var(--text-secondary)' }}>
                Teste seus conhecimentos sobre inteligência artificial e fake news. São 5 perguntas — cada sessão sorteia perguntas diferentes!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
              {[['5', 'Perguntas'], ['3', 'Opções cada'], ['100%', 'Educativo']].map(([val, label]) => (
                <div key={label} className="glass-card p-3 text-center">
                  <p className="text-xl font-bold" style={{ color: '#00d4ff' }}>{val}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>

            <div
              className="flex items-center gap-2 px-5 py-3 rounded-xl"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.3)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="#00d4ff" strokeWidth="2" />
                <path d="M11 18h2" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-semibold" style={{ color: '#00d4ff' }}>
                Toque em &quot;Iniciar Quiz&quot; no seu celular
              </span>
            </div>
          </motion.div>
        )}

        {/* Question */}
        {state === 'question' && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              {/* Question */}
              <div className="glass-card p-6">
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                  PERGUNTA {currentQ + 1} DE {deck.length}
                </p>
                <h3 className="text-xl font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {question.question}
                </h3>
              </div>

              {/* Aviso enquanto o Detetive lê a pergunta */}
              {!canAnswer && selected === null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-sm font-semibold"
                  style={{ color: '#00d4ff' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Ouça o Detetive ler a pergunta...
                </motion.div>
              )}

              {/* Responda pelo celular */}
              {canAnswer && selected === null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-sm font-semibold"
                  style={{ color: '#00d4ff' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="currentColor" strokeWidth="2" />
                    <path d="M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Escolha a resposta no seu celular
                </motion.div>
              )}

              {/* Options */}
              <div
                className="space-y-3"
                style={{ opacity: canAnswer ? 1 : 0.45, pointerEvents: canAnswer ? 'auto' : 'none', transition: 'opacity 0.3s' }}
              >
                {question.options.map((opt, idx) => {
                  const isCorrect = idx === question.correct;
                  const isSelected = idx === selected;
                  const showResult = selected !== null;

                  let borderColor = 'rgba(0,212,255,0.2)';
                  let bgColor = 'rgba(0,20,40,0.3)';
                  let textColor = 'var(--text-primary)';

                  if (showResult) {
                    if (isCorrect) {
                      borderColor = '#00dd44';
                      bgColor = 'rgba(0,221,68,0.12)';
                      textColor = '#00dd44';
                    } else if (isSelected && !isCorrect) {
                      borderColor = '#ff3344';
                      bgColor = 'rgba(255,51,68,0.12)';
                      textColor = '#ff3344';
                    }
                  }

                  return (
                    <div
                      key={idx}
                      className="w-full p-4 rounded-xl text-left flex items-center gap-4 transition-all duration-200"
                      style={{
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{
                          background: showResult && isCorrect ? '#00dd44' : showResult && isSelected ? '#ff3344' : 'rgba(0,212,255,0.15)',
                          border: `1px solid ${showResult && isCorrect ? '#00dd44' : showResult && isSelected ? '#ff3344' : 'rgba(0,212,255,0.3)'}`,
                        }}
                      >
                        {showResult && isCorrect ? '✓' : showResult && isSelected ? '✗' : String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-sm font-medium">{opt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {selected !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-xl"
                    style={{
                      background: selected === question.correct ? 'rgba(0,221,68,0.1)' : 'rgba(255,170,0,0.1)',
                      border: `1px solid ${selected === question.correct ? 'rgba(0,221,68,0.3)' : 'rgba(255,170,0,0.3)'}`,
                    }}
                  >
                    <p className="text-sm font-semibold mb-1" style={{ color: selected === question.correct ? '#00dd44' : '#ffaa00' }}>
                      {selected === question.correct ? 'Correto!' : 'Incorreto!'} — Explicação:
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{question.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {selected !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-sm font-semibold py-2"
                  style={{ color: '#00d4ff' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="currentColor" strokeWidth="2" />
                    <path d="M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {currentQ < deck.length - 1 ? 'Toque em "Próxima" no seu celular' : 'Toque em "Ver resultado" no seu celular'}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Analisando */}
        {state === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-5 text-center"
          >
            <motion.div
              className="rounded-full"
              style={{ width: 72, height: 72, border: '4px solid rgba(0,212,255,0.2)', borderTopColor: '#00d4ff' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div>
              <h3 className="text-2xl font-bold mb-1" style={{ color: '#00d4ff' }}>Analisando suas respostas...</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>O Detetive está somando os seus pontos.</p>
            </div>
          </motion.div>
        )}

        {/* Result */}
        {state === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full gap-6 text-center max-w-xl mx-auto"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6 }}
              className="text-6xl"
            >
              {pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '📚'}
            </motion.div>

            <div>
              <h3 className="text-3xl font-bold mb-2" style={{ color: resultColor }}>
                {score}/{deck.length}
              </h3>
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {pct}% de acertos
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{resultMsg}</p>
            </div>

            {/* Score bar */}
            <div className="w-full max-w-xs h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${resultColor}88, ${resultColor})` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>

            {/* Answer summary */}
            <div className="w-full grid grid-cols-5 gap-2">
              {deck.map((q, i) => {
                const ans = answers[i];
                const correct = ans === q.correct;
                return (
                  <div
                    key={i}
                    className="h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      background: correct ? 'rgba(0,221,68,0.2)' : 'rgba(255,51,68,0.2)',
                      border: `1px solid ${correct ? '#00dd44' : '#ff3344'}55`,
                      color: correct ? '#00dd44' : '#ff3344',
                    }}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>

            <div
              className="flex items-center gap-2 px-5 py-3 rounded-xl"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.3)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="#00d4ff" strokeWidth="2" />
                <path d="M11 18h2" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-semibold" style={{ color: '#00d4ff' }}>
                Continue pelo seu celular
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

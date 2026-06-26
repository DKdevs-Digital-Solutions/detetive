'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, QuizQuestion } from '@/types';
import { QUIZ_QUESTIONS } from '@/data/quiz';
import { useGame } from '@/context/GameProvider';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';

interface QuizScreenProps {
  onNavigate: (screen: Screen) => void;
  onAdvance: () => void;
}

type QuizState = 'intro' | 'question' | 'result';

// Embaralhamento Fisher-Yates (cópia — não muta o original).
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Monta o baralho da sessão: ordem das perguntas E ordem das alternativas
// embaralhadas, com o índice da resposta correta remapeado. Evita o vício de
// "a resposta é quase sempre a letra B".
function buildDeck(): QuizQuestion[] {
  return shuffle(QUIZ_QUESTIONS).map((q) => {
    const tagged = q.options.map((text, i) => ({ text, correct: i === q.correct }));
    const mixed = shuffle(tagged);
    return {
      ...q,
      options: mixed.map((o) => o.text),
      correct: mixed.findIndex((o) => o.correct),
    };
  });
}

export default function QuizScreen({ onNavigate, onAdvance }: QuizScreenProps) {
  const { grantBadge } = useGame();
  const { speak, stop: stopSpeaking } = useElevenLabsSpeech();
  const [deck, setDeck] = useState<QuizQuestion[]>(() => buildDeck());
  const [state, setState] = useState<QuizState>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(deck.length).fill(null));
  const [canAnswer, setCanAnswer] = useState(false);

  const question = deck[currentQ];
  const progress = ((currentQ) / deck.length) * 100;

  const spokenQRef = useRef(-1);

  // O Detetive lê cada pergunta em voz alta; só libera as respostas ao terminar.
  useEffect(() => {
    if (state === 'question' && question && spokenQRef.current !== currentQ) {
      spokenQRef.current = currentQ;
      setCanAnswer(false);
      const optionsText = question.options.map((o, i) => `Opção ${String.fromCharCode(65 + i)}: ${o}.`).join(' ');
      let unlocked = false;
      const unlock = () => { if (!unlocked) { unlocked = true; setCanAnswer(true); } };
      speak(`${question.question} ${optionsText}`, unlock);
      // Segurança: libera mesmo se o áudio falhar ou não terminar.
      const safety = setTimeout(unlock, 15000);
      return () => clearTimeout(safety);
    }
  }, [state, currentQ, question, speak]);

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
    // O Detetive reage e lê a explicação (mais fala que leitura).
    speak(`${correct ? 'Isso! Resposta certa.' : 'Quase! Olha só.'} ${question.explanation}`);
  };

  const handleNext = () => {
    setSelected(null);
    if (currentQ < deck.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      setState('result');
      grantBadge('quiz'); // selo da jornada
      fetch('/api/log', {
        method: 'POST',
        body: JSON.stringify({ type: 'quiz', score: Math.round((score / deck.length) * 100) }),
      }).catch(() => {});
    }
  };

  const handleRestart = () => {
    stopSpeaking();
    spokenQRef.current = -1;
    setCanAnswer(false);
    setDeck(buildDeck()); // nova ordem de perguntas e respostas
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
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>10 perguntas sobre IA e fake news</p>
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
                Teste seus conhecimentos sobre inteligência artificial, fake news e uso responsável da tecnologia. São 10 perguntas com explicações educativas!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
              {[['10', 'Perguntas'], ['3', 'Opções cada'], ['100%', 'Educativo']].map(([val, label]) => (
                <div key={label} className="glass-card p-3 text-center">
                  <p className="text-xl font-bold" style={{ color: '#00d4ff' }}>{val}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setState('question')}
              className="btn btn-primary px-10 py-3 text-base"
            >
              Iniciar Quiz
            </motion.button>
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
                    <motion.button
                      key={idx}
                      whileHover={selected === null ? { scale: 1.01, x: 4 } : {}}
                      whileTap={selected === null ? { scale: 0.99 } : {}}
                      onClick={() => handleSelect(idx)}
                      className="w-full p-4 rounded-xl text-left flex items-center gap-4 transition-all duration-200"
                      style={{
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                        cursor: selected !== null ? 'default' : 'pointer',
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
                    </motion.button>
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
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="w-full btn btn-primary py-3"
                >
                  {currentQ < deck.length - 1 ? 'Próxima Pergunta' : 'Ver Resultado'}
                </motion.button>
              )}
            </motion.div>
          </AnimatePresence>
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

            <div className="flex gap-3">
              <button onClick={handleRestart} className="btn btn-ghost">
                Jogar Novamente
              </button>
              <button onClick={onAdvance} className="btn btn-primary">
                Continuar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/types';
import { QUIZ_QUESTIONS } from '@/data/quiz';
import { useGame } from '@/context/GameProvider';

interface QuizScreenProps {
  onNavigate: (screen: Screen) => void;
}

type QuizState = 'intro' | 'question' | 'result';

export default function QuizScreen({ onNavigate }: QuizScreenProps) {
  const { grantBadge } = useGame();
  const [state, setState] = useState<QuizState>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ_QUESTIONS.length).fill(null));

  const question = QUIZ_QUESTIONS[currentQ];
  const progress = ((currentQ) / QUIZ_QUESTIONS.length) * 100;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
    if (idx === question.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setSelected(null);
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      setState('result');
      grantBadge('quiz'); // selo da jornada
      fetch('/api/log', {
        method: 'POST',
        body: JSON.stringify({ type: 'quiz', score: Math.round((score / QUIZ_QUESTIONS.length) * 100) }),
      }).catch(() => {});
    }
  };

  const handleRestart = () => {
    setState('intro');
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setAnswers(Array(QUIZ_QUESTIONS.length).fill(null));
  };

  const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
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
              {currentQ + 1}/{QUIZ_QUESTIONS.length}
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
                  PERGUNTA {currentQ + 1} DE {QUIZ_QUESTIONS.length}
                </p>
                <h3 className="text-xl font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {question.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
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
                  {currentQ < QUIZ_QUESTIONS.length - 1 ? 'Próxima Pergunta' : 'Ver Resultado'}
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
                {score}/{QUIZ_QUESTIONS.length}
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
              {QUIZ_QUESTIONS.map((q, i) => {
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
              <button onClick={handleRestart} className="btn btn-primary">
                Jogar Novamente
              </button>
              <button onClick={() => onNavigate('home')} className="btn btn-ghost">
                Menu Principal
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

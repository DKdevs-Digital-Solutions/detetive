'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/types';
import { AI_ERROR_EXAMPLES } from '@/data/aiErrors';
import { useGame } from '@/context/GameProvider';

interface AIErrorsScreenProps {
  onNavigate: (screen: Screen) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Alucinação: '👻',
  'Informação desatualizada': '🕰️',
  'Contexto insuficiente': '❓',
  'Viés nos dados': '⚖️',
  'Fonte inexistente': '📭',
};

export default function AIErrorsScreen({ onNavigate }: AIErrorsScreenProps) {
  const { grantBadge } = useGame();
  const [selected, setSelected] = useState<number | null>(null);

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
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Exemplos práticos de como a IA falha</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* Intro card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 mb-5 flex gap-4 items-start"
          style={{ borderColor: 'rgba(255,170,0,0.3)', background: 'rgba(255,170,0,0.06)' }}
        >
          <span className="text-3xl shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: '#ffaa00' }}>Sim! A IA pode errar!</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              A inteligência artificial gera respostas baseadas em padrões de dados, não em compreensão real do mundo. Por isso, pode cometer erros graves, às vezes com muita confiança. Clique em cada tipo de erro para ver um exemplo.
            </p>
          </div>
        </motion.div>

        {/* Error cards */}
        <div className="space-y-3">
          {AI_ERROR_EXAMPLES.map((ex, i) => {
            const isOpen = selected === ex.id;
            return (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl overflow-hidden"
                style={{
                  border: `1px solid ${isOpen ? ex.color + '55' : 'rgba(0,212,255,0.12)'}`,
                  background: isOpen ? `${ex.color}08` : 'rgba(0,15,30,0.4)',
                }}
              >
                {/* Trigger */}
                <button
                  className="w-full p-4 flex items-center gap-3 text-left"
                  onClick={() => { setSelected(isOpen ? null : ex.id); grantBadge('ai-errors'); }}
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
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                </button>

                {/* Expanded content */}
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
                        {/* Wrong answer */}
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,51,68,0.1)', border: '1px solid rgba(255,51,68,0.25)' }}>
                          <p className="text-xs font-bold mb-1" style={{ color: '#ff3344' }}>
                            O que a IA respondeu (ERRADO):
                          </p>
                          <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
                            &quot;{ex.wrongAnswer}&quot;
                          </p>
                        </div>

                        {/* Correct info */}
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(0,221,68,0.08)', border: '1px solid rgba(0,221,68,0.2)' }}>
                          <p className="text-xs font-bold mb-1" style={{ color: '#00dd44' }}>
                            O que é correto:
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {ex.correctAnswer}
                          </p>
                        </div>

                        {/* Explanation */}
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(0,50,80,0.3)', border: '1px solid rgba(0,212,255,0.15)' }}>
                          <p className="text-xs font-bold mb-1" style={{ color: '#00d4ff' }}>
                            Por que isso acontece:
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {ex.explanation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 glass-card p-4 text-center"
        >
          <p className="text-sm font-bold mb-1" style={{ color: '#00d4ff' }}>
            A lição mais importante:
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            &quot;A inteligência artificial pode ajudar muito, mas não substitui o pensamento humano. Sempre verifique, compare e reflita.&quot;
          </p>
        </motion.div>
      </div>
    </div>
  );
}

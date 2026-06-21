'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Screen, BadgeId } from '@/types';
import Avatar from '@/components/ui/Avatar';
import BadgeSeal from '@/components/ui/BadgeSeal';
import { useGame } from '@/context/GameProvider';
import { BADGES } from '@/lib/game';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
  isOnline: boolean;
}

const MENU_ITEMS = [
  {
    id: 'assistant' as Screen,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Conversar com a IA',
    description: 'Perguntas por voz ou texto',
    color: '#00d4ff',
  },
  {
    id: 'news' as Screen,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    label: 'Analisar uma Notícia',
    description: 'Semáforo de confiança',
    color: '#0066ff',
  },
  {
    id: 'quiz' as Screen,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    label: 'Quiz Interativo',
    description: '10 perguntas sobre IA e fake news',
    color: '#8855ff',
  },
  {
    id: 'checklist' as Screen,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Checklist Anti-Fake News',
    description: '10 perguntas de verificação',
    color: '#00dd44',
  },
  {
    id: 'ai-errors' as Screen,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'A IA Pode Errar?',
    description: 'Exemplos práticos de erros da IA',
    color: '#ffaa00',
  },
];

const BADGE_SET = new Set(BADGES.map((b) => b.id));

export default function HomeScreen({ onNavigate, isOnline }: HomeScreenProps) {
  const { badges, collectedCount, totalCount, allComplete, certificateIssued } = useGame();
  return (
    <div className="w-full h-full flex overflow-hidden portrait:flex-col portrait:overflow-y-auto">
      {/* Left panel: Avatar + title */}
      <div className="flex flex-col items-center justify-center gap-5 px-8 w-[38%] min-w-[320px] portrait:w-full portrait:min-w-0 portrait:shrink-0 portrait:justify-start portrait:gap-3 portrait:py-5">
                <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Avatar status="idle" size={220} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#00d4ff' }}>
            Detetive
          </h1>
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            Tecnologia para investigar o que é real.
          </p>
          <div
            className="text-sm px-4 py-2 rounded-xl"
            style={{
              background: 'rgba(0,40,80,0.4)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            Olá! Sou o Detetive. Posso te ajudar a descobrir se uma informação é confiável e ensinar sobre uso responsável da IA.
          </div>
        </motion.div>

        {!isOnline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
            style={{
              background: 'rgba(255,170,0,0.1)',
              border: '1px solid rgba(255,170,0,0.3)',
              color: '#ffaa00',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Modo offline ativo — respostas pré-programadas
          </motion.div>
        )}
      </div>

      {/* Right panel: Menu grid */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4 overflow-y-auto portrait:justify-start portrait:flex-none">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm font-medium mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Escolha uma opção para começar:
        </motion.p>

        <div className="grid grid-cols-2 gap-3">
          {MENU_ITEMS.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(item.id)}
              className="glass-card p-4 text-left transition-all duration-200 group relative"
              style={{
                borderColor: badges[item.id as BadgeId] ? `${item.color}66` : `${item.color}22`,
                cursor: 'pointer',
              }}
            >
              {/* Selo conquistado */}
              {BADGE_SET.has(item.id as BadgeId) && badges[item.id as BadgeId] && (
                <div
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: item.color, boxShadow: `0 0 10px ${item.color}99` }}
                  title="Selo conquistado"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#001018" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{
                  background: `${item.color}18`,
                  border: `1px solid ${item.color}44`,
                  color: item.color,
                }}
              >
                {item.icon}
              </div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                {item.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {item.description}
              </p>
            </motion.button>
          ))}
        </div>

        {/* ─── Jornada de selos ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-4 p-4 rounded-2xl"
          style={{
            background: allComplete ? 'rgba(0,221,102,0.08)' : 'rgba(0,30,60,0.4)',
            border: `1px solid ${allComplete ? 'rgba(0,221,102,0.4)' : 'rgba(0,212,255,0.18)'}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="#ffcc44" strokeWidth="2" />
                <path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5" stroke="#ffcc44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Jornada do Detetive
              </span>
            </div>
            <span className="text-xs font-semibold" style={{ color: allComplete ? '#00dd66' : '#00d4ff' }}>
              {collectedCount} de {totalCount} selos
            </span>
          </div>

          {/* Selos */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {BADGES.map((b) => {
              const got = badges[b.id];
              return (
                <button
                  key={b.id}
                  onClick={() => onNavigate(b.screen)}
                  className="flex-1 flex flex-col items-center gap-1.5"
                  title={b.label}
                >
                  <BadgeSeal id={b.id} color={b.color} earned={got} size={46} />
                  <span className="text-[10px] text-center leading-tight" style={{ color: got ? b.color : 'var(--text-muted)' }}>
                    {b.short}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Ação */}
          {certificateIssued ? (
            <div className="text-center text-xs py-2 rounded-lg" style={{ color: '#00dd66', background: 'rgba(0,221,102,0.1)' }}>
              Certificado emitido. Obrigado por participar!
            </div>
          ) : allComplete ? (
            <motion.button
              onClick={() => onNavigate('certificate')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{ boxShadow: ['0 0 0px #00dd66', '0 0 18px #00dd6688', '0 0 0px #00dd66'] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="w-full py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #00dd66, #00aa44)', color: '#fff' }}
            >
              Resgatar Certificado
            </motion.button>
          ) : (
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Complete as atividades para ganhar seu certificado de participação.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

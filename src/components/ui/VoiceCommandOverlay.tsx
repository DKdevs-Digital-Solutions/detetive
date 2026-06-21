'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/types';

interface Props {
  feedback: { screen: Screen; text: string } | null;
}

const SCREEN_INFO: Record<Screen, { label: string; color: string; icon: React.ReactNode }> = {
  home: {
    label: 'Menu Principal',
    color: '#00d4ff',
    icon: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.25" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  assistant: {
    label: 'Conversar com o Detetive',
    color: '#00d4ff',
    icon: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  news: {
    label: 'Analisar Notícia',
    color: '#0088ff',
    icon: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
        <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  quiz: {
    label: 'Quiz Interativo',
    color: '#9966ff',
    icon: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  checklist: {
    label: 'Checklist Anti-Fake News',
    color: '#00dd66',
    icon: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <polyline points="9 11 12 14 22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
      </svg>
    ),
  },
  'ai-errors': {
    label: 'A IA Pode Errar?',
    color: '#ffaa00',
    icon: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  certificate: {
    label: 'Emitir Certificado',
    color: '#00dd66',
    icon: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <path d="M6 2h9l3 3v17H6z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round"/>
        <path d="M15 2v4h4M9 11h6M9 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  admin: {
    label: 'Painel Admin',
    color: '#aaaaaa',
    icon: (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
};

export default function VoiceCommandOverlay({ feedback }: Props) {
  const info = feedback ? SCREEN_INFO[feedback.screen] : null;

  return (
    <AnimatePresence>
      {feedback && info && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ backdropFilter: 'blur(14px)', background: 'rgba(0,4,16,0.78)' }}
        >
          {/* Brilho de fundo */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 600, height: 600,
              background: `radial-gradient(circle, ${info.color}18 0%, transparent 70%)`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
          />

          <motion.div
            initial={{ scale: 0.65, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="relative flex flex-col items-center gap-6 rounded-3xl px-14 py-10"
            style={{
              background: 'rgba(4, 10, 28, 0.92)',
              border: `1.5px solid ${info.color}55`,
              boxShadow: `0 0 0 1px ${info.color}18, 0 0 80px ${info.color}22, 0 30px 80px rgba(0,0,0,0.6)`,
              minWidth: 380,
            }}
          >
            {/* Ícone da tela de destino */}
            <motion.div
              style={{ color: info.color, filter: `drop-shadow(0 0 20px ${info.color}cc)` }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
            >
              {info.icon}
            </motion.div>

            {/* Label "Comando de voz reconhecido" */}
            <motion.p
              className="text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: `${info.color}88` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Comando de voz reconhecido
            </motion.p>

            {/* Texto reconhecido */}
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: `${info.color}12`, border: `1px solid ${info.color}22` }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: info.color, flexShrink: 0 }}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-base italic" style={{ color: 'rgba(255,255,255,0.65)' }}>
                &ldquo;{feedback.text}&rdquo;
              </span>
            </motion.div>

            {/* Destino */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.32, type: 'spring', stiffness: 300 }}
            >
              <motion.svg
                width="22" height="22" viewBox="0 0 24 24" fill="none"
                style={{ color: info.color }}
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </motion.svg>
              <span className="text-2xl font-bold" style={{ color: info.color, textShadow: `0 0 20px ${info.color}88` }}>
                {info.label}
              </span>
            </motion.div>

            {/* Barra de progresso */}
            <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: `${info.color}20` }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: info.color, boxShadow: `0 0 12px ${info.color}` }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.35, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

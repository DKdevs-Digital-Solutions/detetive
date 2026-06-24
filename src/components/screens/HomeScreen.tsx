'use client';

import { motion } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import { JOURNEY, PHASE_LABELS } from '@/lib/game';

interface HomeScreenProps {
  onStart: () => void;
  onPlayWelcome: () => void;
  canSpeak: boolean;
  welcomeText: string;
  isOnline: boolean;
}

/**
 * Tela inicial da jornada (retrato/totem).
 * A mensagem de boas-vindas aparece em TEXTO; a voz só toca quando a pessoa
 * toca em "Ouvir" (não há leitura automática a cada visitante).
 */
export default function HomeScreen({ onStart, onPlayWelcome, canSpeak, welcomeText, isOnline }: HomeScreenProps) {
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-center gap-6 px-6 py-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Avatar status="idle" size={200} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-2 max-w-xl"
      >
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: '#00d4ff' }}>
          DETETIVE <span style={{ color: '#fff' }}>IA</span>
        </h1>
        <p className="text-base sm:text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
          Tecnologia para investigar o que é real.
        </p>
      </motion.div>

      {/* Mensagem de boas-vindas em TEXTO + botão de ouvir */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5 max-w-xl w-full flex flex-col items-center gap-4"
      >
        <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {welcomeText}
        </p>

        {canSpeak && (
          <button
            onClick={onPlayWelcome}
            className="btn btn-ghost text-sm"
            style={{ padding: '10px 20px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Ouvir a mensagem
          </button>
        )}
      </motion.div>

      {/* Prévia das fases */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="flex flex-wrap items-center justify-center gap-2 max-w-2xl"
      >
        {JOURNEY.map((s, i) => (
          <div
            key={s}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0,30,60,0.5)', border: '1px solid rgba(0,212,255,0.18)' }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ background: 'rgba(0,212,255,0.18)', color: '#00d4ff' }}
            >
              {i + 1}
            </span>
            <span className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
              {PHASE_LABELS[s]}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Começar */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="btn btn-primary text-lg sm:text-xl"
        style={{ padding: '16px 40px' }}
      >
        Começar a investigação
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>

      {!isOnline && (
        <div
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', color: '#ffaa00' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Modo offline ativo — respostas pré-programadas
        </div>
      )}
    </div>
  );
}

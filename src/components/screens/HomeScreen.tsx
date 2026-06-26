'use client';

import { motion } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import { JOURNEY, PHASE_LABELS } from '@/lib/game';

interface HomeScreenProps {
  onStart: () => void;
  isOnline: boolean;
  /** URL do controle desta sessão; quando presente, mostra o QR para o celular. */
  controlUrl?: string;
}

/**
 * Tela inicial da jornada (retrato/totem).
 * A saudação é falada automaticamente uma vez por sessão (disparada ao dispensar
 * o descanso de tela). Aqui não há texto de boas-vindas — só o convite a começar.
 */
export default function HomeScreen({ onStart, isOnline, controlUrl }: HomeScreenProps) {
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

      {/* QR: controle pelo próprio celular (pareia com esta sessão) */}
      {controlUrl && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex items-center gap-4 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(0,30,60,0.5)', border: '1px solid rgba(0,212,255,0.22)' }}
        >
          <div className="rounded-xl overflow-hidden shrink-0" style={{ background: '#fff', padding: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/control/qr?data=${encodeURIComponent(controlUrl)}`}
              alt="QR para controlar pelo celular"
              width={104}
              height={104}
              style={{ display: 'block', width: 104, height: 104 }}
            />
          </div>
          <div className="text-left max-w-[210px]">
            <p className="text-sm font-bold" style={{ color: '#00d4ff' }}>Use o seu celular</p>
            <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--text-secondary)' }}>
              Aponte a câmera para o QR e conduza a investigação pelo seu telefone.
            </p>
          </div>
        </motion.div>
      )}

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

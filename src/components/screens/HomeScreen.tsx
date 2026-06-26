'use client';

import { motion } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import { JOURNEY, PHASE_LABELS } from '@/lib/game';

interface HomeScreenProps {
  isOnline: boolean;
  /** URL do controle desta sessão; quando presente, mostra o QR para o celular. */
  controlUrl?: string;
  /** Quando um celular já pareou: esconde o QR (evita outro acesso). */
  controllerConnected?: boolean;
}

// Partículas de dados flutuantes (posições fixas — evita mismatch de hidratação).
const PARTICLES = [
  { left: '8%', top: '22%', size: 5, dur: 7, delay: 0 },
  { left: '18%', top: '70%', size: 3, dur: 9, delay: 1.2 },
  { left: '30%', top: '14%', size: 4, dur: 8, delay: 0.5 },
  { left: '44%', top: '82%', size: 6, dur: 10, delay: 2 },
  { left: '58%', top: '18%', size: 3, dur: 7.5, delay: 0.8 },
  { left: '70%', top: '64%', size: 5, dur: 9.5, delay: 1.6 },
  { left: '82%', top: '28%', size: 4, dur: 8.5, delay: 0.3 },
  { left: '90%', top: '74%', size: 3, dur: 7, delay: 2.4 },
  { left: '12%', top: '48%', size: 4, dur: 11, delay: 1 },
  { left: '64%', top: '40%', size: 3, dur: 8, delay: 1.9 },
  { left: '38%', top: '56%', size: 5, dur: 9, delay: 0.6 },
  { left: '76%', top: '12%', size: 4, dur: 10, delay: 2.2 },
];

/**
 * Tela inicial da jornada (retrato/totem).
 * A jornada começa SOMENTE pelo celular do visitante (QR) — não há botão de
 * "começar" no totem. A saudação é falada automaticamente uma vez por sessão.
 * Efeitos de fundo animados (tema IA) — o PC do totem aguenta.
 */
export default function HomeScreen({ isOnline, controlUrl, controllerConnected }: HomeScreenProps) {
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center gap-6 px-6 py-8 text-center">
      {/* ─── Efeitos de fundo ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Brilho pulsante central */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{
            width: 900, height: 900, marginLeft: -450, marginTop: -450, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,120,255,0.16) 0%, transparent 60%)',
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Varredura de radar */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{
            width: 760, height: 760, marginLeft: -380, marginTop: -380, borderRadius: '50%',
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,212,255,0.10) 40deg, transparent 80deg)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
        {/* Anéis concêntricos */}
        {[300, 460, 620].map((d, i) => (
          <motion.div
            key={d}
            className="absolute left-1/2 top-1/2"
            style={{
              width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2, borderRadius: '50%',
              border: '1px solid rgba(0,212,255,0.12)',
            }}
            animate={{ opacity: [0.15, 0.4, 0.15], scale: [1, 1.04, 1] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
          />
        ))}
        {/* Partículas de dados */}
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size, background: 'rgba(0,212,255,0.7)', boxShadow: '0 0 8px rgba(0,212,255,0.8)' }}
            animate={{ y: [0, -22, 0], opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          />
        ))}
      </div>

      {/* ─── Conteúdo ─── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10"
      >
        {/* Aura giratória atrás do avatar */}
        <motion.div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: 280, height: 280, marginLeft: -140, marginTop: -140, borderRadius: '50%',
            background: 'conic-gradient(from 0deg, rgba(0,212,255,0.0), rgba(0,212,255,0.35), rgba(0,212,255,0.0))',
            filter: 'blur(8px)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <div className="relative">
          <Avatar status="idle" size={200} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 flex flex-col items-center gap-2 max-w-xl"
      >
        <motion.h1
          className="text-4xl sm:text-5xl font-black tracking-tight"
          style={{ color: '#00d4ff' }}
          animate={{ textShadow: ['0 0 18px rgba(0,212,255,0.35)', '0 0 34px rgba(0,212,255,0.7)', '0 0 18px rgba(0,212,255,0.35)'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          DETETIVE <span style={{ color: '#fff' }}>IA</span>
        </motion.h1>
        <p className="text-base sm:text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
          Tecnologia para investigar o que é real.
        </p>
      </motion.div>

      {/* Prévia das fases */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="relative z-10 flex flex-wrap items-center justify-center gap-2 max-w-2xl"
      >
        {JOURNEY.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.08 }}
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
          </motion.div>
        ))}
      </motion.div>

      {/* Celular já pareado: esconde o QR e confirma a conexão */}
      {controllerConnected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex items-center gap-3 px-6 py-4 rounded-2xl"
          style={{ background: 'rgba(0,221,102,0.1)', border: '1px solid rgba(0,221,102,0.45)', boxShadow: '0 0 30px rgba(0,221,102,0.15)' }}
        >
          <motion.span
            className="w-3 h-3 rounded-full"
            style={{ background: '#00dd66', boxShadow: '0 0 10px #00dd66' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <div className="text-left">
            <p className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: '#00dd66' }}>Celular conectado!</p>
            <p className="text-sm sm:text-base mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
              Comece a investigação pelo seu telefone.
            </p>
          </div>
        </motion.div>
      )}

      {/* QR: a jornada começa pelo celular do visitante (pareia com esta sessão) */}
      {!controllerConnected && controlUrl && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="relative z-10 flex items-center gap-4 px-5 py-4 lg:px-7 lg:py-6 rounded-2xl"
          style={{ background: 'rgba(0,30,60,0.5)', border: '1px solid rgba(0,212,255,0.22)', boxShadow: '0 0 30px rgba(0,212,255,0.12)' }}
        >
          <div className="rounded-xl overflow-hidden shrink-0" style={{ background: '#fff', padding: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/control/qr?data=${encodeURIComponent(controlUrl)}`}
              alt="QR para começar pelo celular"
              className="block w-[128px] h-[128px] lg:w-[176px] lg:h-[176px]"
            />
          </div>
          <div className="text-left max-w-[240px] lg:max-w-[320px]">
            <p className="text-base lg:text-2xl font-bold" style={{ color: '#00d4ff' }}>Comece pelo seu celular</p>
            <p className="text-sm lg:text-lg mt-1 leading-snug" style={{ color: 'var(--text-secondary)' }}>
              Aponte a câmera para o QR Code e conduza toda a investigação pelo seu telefone.
            </p>
          </div>
        </motion.div>
      )}

      {!isOnline && (
        <div
          className="relative z-10 flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
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

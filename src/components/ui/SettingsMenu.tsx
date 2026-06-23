'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/types';
import { useSettings } from '@/context/SettingsProvider';
import { useGame } from '@/context/GameProvider';
import WhatsAppPanel from '@/components/ui/WhatsAppPanel';

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-3 rounded-xl p-3 text-left"
      style={{ background: 'rgba(0,20,40,0.4)', border: '1px solid rgba(0,212,255,0.15)' }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      </div>
      <div
        className="shrink-0 rounded-full transition-colors"
        style={{ width: 46, height: 26, padding: 3, background: value ? '#00cc66' : 'rgba(255,255,255,0.15)' }}
      >
        <motion.div
          className="rounded-full bg-white"
          style={{ width: 20, height: 20 }}
          animate={{ x: value ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

export default function SettingsMenu({ open, onClose, onNavigate }: Props) {
  const { voice, sound, idleSeconds, set } = useSettings();
  const { resetJourney } = useGame();

  const IDLE_OPTIONS = [
    { label: '30s', value: 30 },
    { label: '1min', value: 60 },
    { label: '2min', value: 120 },
    { label: '3min', value: 180 },
    { label: 'Desligado', value: 0 },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(0,4,14,0.92)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-2xl overflow-hidden flex flex-col"
            style={{
              maxWidth: 460, maxHeight: '88vh',
              background: 'rgba(6, 14, 28, 0.98)',
              border: '1px solid rgba(0,212,255,0.25)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="#00d4ff" strokeWidth="2" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#00d4ff" strokeWidth="1.5" />
                </svg>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Configurações do Totem</h2>
              </div>
              <button onClick={onClose} className="btn btn-ghost p-2" aria-label="Fechar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div className="overflow-y-auto p-5 space-y-4">
              {/* Recursos */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Recursos</p>
                <Toggle label="Microfone / voz" hint="Escutar perguntas por voz" value={voice} onChange={(v) => set('voice', v)} />
                <Toggle label="Voz do Detetive" hint="Narração e respostas faladas" value={sound} onChange={(v) => set('sound', v)} />
              </div>

              {/* Descanso de tela */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Descanso de tela (inatividade)</p>
                <div className="flex gap-1.5 flex-wrap">
                  {IDLE_OPTIONS.map((opt) => {
                    const active = idleSeconds === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => set('idleSeconds', opt.value)}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold"
                        style={{
                          minWidth: 60,
                          background: active ? 'linear-gradient(135deg, #00d4ff, #0066ff)' : 'rgba(0,20,40,0.4)',
                          border: `1px solid ${active ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.15)'}`,
                          color: active ? '#fff' : 'var(--text-secondary)',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>WhatsApp</p>
                <WhatsAppPanel />
              </div>

              {/* Administração */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Administração</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onClose(); onNavigate('admin'); }}
                    className="flex-1 btn btn-ghost text-sm"
                  >
                    Estatísticas
                  </button>
                  <button
                    onClick={() => { resetJourney(); }}
                    className="flex-1 btn text-sm"
                    style={{ background: 'rgba(255,170,0,0.12)', border: '1px solid rgba(255,170,0,0.3)', color: '#ffaa00' }}
                  >
                    Zerar jornada
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

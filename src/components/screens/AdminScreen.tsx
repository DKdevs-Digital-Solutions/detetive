'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Screen, UsageStats } from '@/types';

interface AdminScreenProps {
  onNavigate: (screen: Screen) => void;
}

export default function AdminScreen({ onNavigate }: AdminScreenProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const login = () => {
    if (password === (process.env.NEXT_PUBLIC_ADMIN_HINT || 'detetive2024')) {
      setAuthenticated(true);
      setAuthError('');
    } else {
      // Try server-side verification
      fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', password }),
      }).then((r) => {
        if (r.status === 401) {
          setAuthError('Senha incorreta');
        } else {
          setAuthenticated(true);
          setAuthError('');
        }
      }).catch(() => {
        // Offline — try default password
        if (password === 'detetive2024') {
          setAuthenticated(true);
        } else {
          setAuthError('Senha incorreta');
        }
      });
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch {
      setStats(null);
    }
  };

  const resetStats = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', password }),
      });
      setResetStatus('Estatísticas resetadas com sucesso!');
      loadStats();
      setTimeout(() => setResetStatus(''), 3000);
    } catch {
      setResetStatus('Erro ao resetar. Tente novamente.');
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    if (authenticated) loadStats();
  }, [authenticated]);

  // Auto-refresh stats every 30s
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [authenticated]);

  const StatCard = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
    <div className="glass-card p-4 text-center">
      <p className="text-2xl font-bold mb-1" style={{ color }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <button onClick={() => onNavigate('home')} className="btn btn-ghost py-2 px-3 text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(255,100,0,0.2)', border: '1px solid rgba(255,100,0,0.4)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="#ff6400" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#ff6400" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Painel Administrativo</h2>
        </div>
        <span className="ml-auto text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,100,0,0.1)', color: '#ff6400' }}>
          Segure a logo do Colégio por 3 segundos
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Auth gate */}
        {!authenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-5 max-w-xs mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,100,0,0.15)', border: '1px solid rgba(255,100,0,0.3)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#ff6400" strokeWidth="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#ff6400" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Acesso Restrito</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Digite a senha para acessar o painel</p>
            </div>

            <div className="w-full space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                placeholder="Senha de acesso..."
                className="w-full text-center"
              />
              {authError && (
                <p className="text-xs" style={{ color: '#ff3344' }}>{authError}</p>
              )}
              <button onClick={login} className="w-full btn btn-primary">
                Entrar
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5 max-w-3xl mx-auto"
          >
            {/* Stats grid */}
            {stats ? (
              <>
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                    Estatísticas desde {new Date(stats.startedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Visitantes" value={stats.visitors} color="#00d4ff" />
                    <StatCard label="Perguntas feitas" value={stats.questions} color="#0066ff" />
                    <StatCard label="Notícias analisadas" value={stats.newsAnalyzed} color="#8855ff" />
                  </div>
                </div>

                {/* Traffic light stats */}
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Resultados das análises</p>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Verde (confiável)" value={stats.greenCount} color="#00dd44" />
                    <StatCard label="Amarelo (atenção)" value={stats.yellowCount} color="#ffaa00" />
                    <StatCard label="Vermelho (suspeito)" value={stats.redCount} color="#ff3344" />
                  </div>
                </div>

                {/* Quiz stats */}
                <div className="glass-card p-4">
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Quiz</p>
                  <div className="flex items-center gap-4">
                    <p className="text-3xl font-bold" style={{ color: '#00d4ff' }}>{stats.quizAvgScore}%</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>pontuação média</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                Carregando estatísticas...
              </div>
            )}

            {/* WhatsApp (Baileys) */}
            <WhatsAppPanel />

            {/* Actions */}
            <div className="glass-card p-4 space-y-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Ações</p>

              <div className="flex gap-3 flex-wrap">
                <button onClick={loadStats} className="btn btn-ghost text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Atualizar dados
                </button>

                <button
                  onClick={resetStats}
                  disabled={isResetting}
                  className="btn text-sm"
                  style={{
                    background: 'rgba(255,51,68,0.15)',
                    border: '1px solid rgba(255,51,68,0.3)',
                    color: '#ff3344',
                    opacity: isResetting ? 0.6 : 1,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {isResetting ? 'Resetando...' : 'Resetar estatísticas'}
                </button>
              </div>

              {resetStatus && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm" style={{ color: '#00dd44' }}>
                  {resetStatus}
                </motion.p>
              )}
            </div>

            {/* System info */}
            <div className="glass-card p-4 space-y-2">
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Informações do sistema</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Modelo de IA', 'Claude Haiku (Anthropic)'],
                  ['Voz (TTS)', 'ElevenLabs (neural)'],
                  ['Reconhecimento de voz', 'Web Speech API'],
                  ['Reconhecimento de gestos', 'MediaPipe Hands (CDN)'],
                  ['Certificado', 'PDF via WhatsApp (Baileys)'],
                  ['Framework', 'Next.js 14 + React 18'],
                ].map(([key, val]) => (
                  <div key={key} className="flex flex-col p-2 rounded-lg" style={{ background: 'rgba(0,20,40,0.4)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{key}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Painel de conexão WhatsApp (Baileys) ─────────────────────────────────────
function WhatsAppPanel() {
  const [status, setStatus] = useState<string>('idle');
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poll = async () => {
    try {
      const res = await fetch('/api/whatsapp');
      const data = await res.json();
      setStatus(data.status);
      setQr(data.qr);
      setError(data.error);
    } catch {
      setStatus('closed');
    }
  };

  useEffect(() => {
    poll();
    const t = setInterval(poll, 2500);
    return () => clearInterval(t);
  }, []);

  const reconnect = () => {
    fetch('/api/whatsapp', { method: 'POST' }).then(poll).catch(() => {});
  };

  const connected = status === 'open';

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" stroke="#25D366" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>WhatsApp (envio de certificados)</p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-semibold"
          style={{
            background: connected ? 'rgba(0,221,68,0.15)' : 'rgba(255,170,0,0.12)',
            color: connected ? '#00dd44' : '#ffaa00',
          }}
        >
          {connected ? 'Conectado' : status === 'qr' ? 'Aguardando QR' : status === 'connecting' ? 'Conectando...' : 'Desconectado'}
        </span>
      </div>

      {connected ? (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Pronto para enviar certificados em PDF pelo WhatsApp do totem.
        </p>
      ) : qr ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
            No celular: WhatsApp → Aparelhos conectados → Conectar um aparelho → escaneie o código.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR do WhatsApp" width={220} height={220} style={{ borderRadius: 12, background: '#fff', padding: 8 }} />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {error ? `Erro: ${error}` : 'Iniciando conexão...'}
          </p>
          <button onClick={reconnect} className="btn btn-ghost text-xs py-1.5 px-3">Reconectar</button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

// Painel de conexão WhatsApp (Baileys) — exibe status e QR para parear.
export default function WhatsAppPanel() {
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
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(0,20,40,0.4)', border: '1px solid rgba(0,212,255,0.15)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" stroke="#25D366" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>WhatsApp (certificados)</p>
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
        <div className="flex flex-col items-center gap-2 py-1">
          <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
            No celular: WhatsApp → Aparelhos conectados → Conectar um aparelho → escaneie.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR do WhatsApp" width={200} height={200} style={{ borderRadius: 10, background: '#fff', padding: 6 }} />
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

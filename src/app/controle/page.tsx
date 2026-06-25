'use client';

import { useState, useEffect, useCallback } from 'react';
import { CONTROL_ROOM } from '@/lib/control';
import { JOURNEY, PHASE_LABELS } from '@/lib/game';

const EXTRA_LABEL: Record<string, string> = {
  home: 'Tela inicial',
  certificate: 'Certificado',
  admin: 'Painel administrativo',
};

function label(screen: string): string {
  return PHASE_LABELS[screen] || EXTRA_LABEL[screen] || 'Acompanhe no totem';
}

export default function ControlPage() {
  const [displayScreen, setDisplayScreen] = useState<string>('home');
  const [online, setOnline] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [certMsg, setCertMsg] = useState('');
  const [sent, setSent] = useState(false);

  const send = useCallback(async (command: Record<string, unknown>) => {
    try {
      await fetch('/api/control/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: CONTROL_ROOM, command: { from: 'controller', ...command } }),
      });
    } catch { /* ignore */ }
  }, []);

  // Conecta à sala fixa e acompanha a fase do totem
  useEffect(() => {
    const es = new EventSource(`/api/control/stream?code=${encodeURIComponent(CONTROL_ROOM)}`);
    es.onopen = () => { send({ type: 'hello' }); };
    es.onmessage = (e) => {
      try {
        const cmd = JSON.parse(e.data);
        if (cmd?.from === 'display' && cmd.type === 'state' && cmd.screen) {
          setDisplayScreen(cmd.screen);
          if (cmd.screen !== 'certificate') { setSent(false); setCertMsg(''); }
        }
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [send]);

  // Verifica se o totem está online
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const r = await fetch(`/api/control/send?code=${encodeURIComponent(CONTROL_ROOM)}`);
        const d = await r.json();
        if (alive) setOnline((d.online || 0) > 1); // >1 = display + este controlador
      } catch { if (alive) setOnline(false); }
    };
    check();
    const t = setInterval(check, 4000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const sendCertificate = async () => {
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) {
      setCertMsg('Preencha o nome e um número válido (com DDD).');
      return;
    }
    setSending(true);
    setCertMsg('');
    try {
      const r = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        setSent(true);
        setName(''); setPhone('');
        send({ type: 'restart' }); // encerra a sessão no totem (próximo visitante)
      } else {
        setCertMsg(
          d.error === 'whatsapp-not-connected' ? 'WhatsApp do totem não conectado. Chame um organizador.'
          : d.error === 'no-whatsapp' ? 'Esse número não tem WhatsApp.'
          : d.error === 'invalid-phone' ? 'Número inválido. Confira o DDD.'
          : 'Não foi possível enviar. Tente novamente.'
        );
      }
    } catch {
      setCertMsg('Falha de conexão.');
    } finally {
      setSending(false);
    }
  };

  const isPhase = JOURNEY.includes(displayScreen as never);

  return (
    <main style={{ minHeight: '100vh', background: '#050a16', color: '#e8f4ff', fontFamily: 'system-ui, sans-serif', padding: 18 }}>
      <div style={{ maxWidth: 460, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#00d4ff' }}>Controle • Detetive IA</h1>
          <span style={{ fontSize: 12, color: online ? '#00dd66' : '#ffaa00' }}>
            {online ? '● totem conectado' : '○ procurando totem...'}
          </span>
        </div>

        {/* Contexto: acompanha a jornada no totem */}
        <div style={{ background: 'rgba(0,30,60,0.5)', border: '1px solid #14406a', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: '#6a8', marginBottom: 4 }}>No totem agora</p>
          <p style={{ fontSize: 17, fontWeight: 700 }}>{label(displayScreen)}</p>
        </div>

        {/* Ação contextual — segue a jornada sequencial */}
        {displayScreen === 'home' && (
          <button onClick={() => send({ type: 'start' })} style={btnPrimary}>Começar a jornada</button>
        )}

        {isPhase && (
          <div style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid #14406a', borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 13, color: '#cde', marginBottom: 12 }}>
              Quando terminar esta etapa no totem, toque para avançar:
            </p>
            <button onClick={() => send({ type: 'advance' })} style={btnPrimary}>Continuar →</button>
          </div>
        )}

        {displayScreen === 'certificate' && (
          sent ? (
            <div style={{ background: 'rgba(0,221,102,0.1)', border: '1px solid #00dd66', borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 40 }}>✅</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#00dd66' }}>Certificado enviado!</p>
              <p style={{ fontSize: 13, color: '#8aa', marginTop: 6 }}>Confira o WhatsApp. O totem já está pronto para o próximo visitante.</p>
            </div>
          ) : (
            <div style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid #14406a', borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 13, marginBottom: 10, color: '#cde' }}>Digite os dados para receber o certificado no WhatsApp:</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" style={inputStyle} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp com DDD (ex: 48 99999-9999)" inputMode="tel" style={{ ...inputStyle, marginTop: 10 }} />
              <button onClick={sendCertificate} disabled={sending} style={{ ...btnPrimary, opacity: sending ? 0.6 : 1 }}>
                {sending ? 'Enviando...' : 'Enviar certificado'}
              </button>
              {certMsg && <p style={{ fontSize: 13, marginTop: 10, color: '#ff9090' }}>{certMsg}</p>}
            </div>
          )
        )}

        {displayScreen === 'admin' && (
          <p style={{ textAlign: 'center', color: '#8aa', fontSize: 14, padding: '20px 8px' }}>Painel aberto no totem.</p>
        )}

        {/* Reiniciar sessão (organizador) */}
        <button onClick={() => send({ type: 'restart' })} style={{ ...btnGhost, width: '100%', marginTop: 22 }}>
          Reiniciar sessão do totem
        </button>
      </div>
    </main>
  );
}

const btnPrimary: React.CSSProperties = {
  width: '100%', marginTop: 0, padding: 16, borderRadius: 12, border: 'none',
  background: 'linear-gradient(135deg, #00d4ff, #0066ff)', color: '#fff', fontSize: 17, fontWeight: 700,
};
const btnGhost: React.CSSProperties = {
  padding: '12px 18px', borderRadius: 10, border: '1px solid #14406a', background: 'transparent', color: '#9bd', fontSize: 14,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: 12, borderRadius: 10, border: '1px solid #14406a', background: '#08121f', color: '#fff', fontSize: 16,
};

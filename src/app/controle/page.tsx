'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JOURNEY, PHASE_LABELS } from '@/lib/game';
import Avatar from '@/components/ui/Avatar';

const EXTRA_LABEL: Record<string, string> = {
  home: 'Tela inicial',
  certificate: 'Hora do certificado',
  admin: 'Painel administrativo',
};

function label(screen: string): string {
  return PHASE_LABELS[screen] || EXTRA_LABEL[screen] || 'Acompanhe no totem';
}

type Status = 'loading' | 'nocode' | 'busy' | 'owned';

export default function ControlPage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('loading');
  const [displayScreen, setDisplayScreen] = useState<string>('home');
  const [online, setOnline] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [certMsg, setCertMsg] = useState('');
  const [sent, setSent] = useState(false);

  const ctrlId = useRef('');

  // Lê o código da sessão (do QR) e gera um id estável para este celular.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('code');
    setCode((c || '').trim().toUpperCase());
    if (!c) { setStatus('nocode'); return; }
    let id = sessionStorage.getItem('detetive-ctrl-id');
    if (!id) { id = Math.random().toString(36).slice(2); sessionStorage.setItem('detetive-ctrl-id', id); }
    ctrlId.current = id;
  }, []);

  const send = useCallback(async (command: Record<string, unknown>) => {
    if (!code) return;
    try {
      await fetch('/api/control/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, command: { from: 'controller', ...command } }),
      });
    } catch { /* ignore */ }
  }, [code]);

  // Reivindica/renova a posse da sessão (1 celular por sessão).
  useEffect(() => {
    if (!code || !ctrlId.current) return;
    let alive = true;
    const claim = async () => {
      try {
        const r = await fetch('/api/control/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, controllerId: ctrlId.current }),
        });
        const d = await r.json();
        if (alive) setStatus(d.granted ? 'owned' : 'busy');
      } catch { /* mantém status atual */ }
    };
    claim();
    const t = setInterval(claim, 8000);
    return () => {
      alive = false;
      clearInterval(t);
      // libera a posse ao sair
      fetch('/api/control/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, controllerId: ctrlId.current, release: true }),
        keepalive: true,
      }).catch(() => {});
    };
  }, [code]);

  // Stream de estado do totem (acompanha a jornada).
  useEffect(() => {
    if (!code || status !== 'owned') return;
    const es = new EventSource(`/api/control/stream?code=${encodeURIComponent(code)}`);
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
  }, [code, status, send]);

  // Indicador online (totem presente na sala).
  useEffect(() => {
    if (!code) return;
    let alive = true;
    const check = async () => {
      try {
        const r = await fetch(`/api/control/send?code=${encodeURIComponent(code)}`);
        const d = await r.json();
        if (alive) setOnline((d.online || 0) > 1);
      } catch { if (alive) setOnline(false); }
    };
    check();
    const t = setInterval(check, 4000);
    return () => { alive = false; clearInterval(t); };
  }, [code]);

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
        send({ type: 'restart' });
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
    <main
      className="relative min-h-screen overflow-hidden flex flex-col"
      style={{ background: 'var(--bg-primary, #050a16)', color: 'var(--text-primary, #e8f4ff)' }}
    >
      {/* Fundo temático */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,102,255,0.14) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col px-5 pt-6 pb-8">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <Avatar status="idle" size={82} />
          <h1 className="text-2xl font-black tracking-tight mt-2" style={{ color: '#00d4ff', textShadow: '0 0 24px rgba(0,212,255,0.45)' }}>
            DETETIVE <span style={{ color: '#fff' }}>IA</span>
          </h1>
          {status === 'owned' && (
            <div
              className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: online ? 'rgba(0,221,102,0.12)' : 'rgba(255,170,0,0.12)',
                border: `1px solid ${online ? 'rgba(0,221,102,0.4)' : 'rgba(255,170,0,0.4)'}`,
                color: online ? '#00dd66' : '#ffaa00',
              }}
            >
              <motion.span
                className="w-2 h-2 rounded-full"
                style={{ background: online ? '#00dd66' : '#ffaa00' }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              {online ? 'Conectado ao totem' : 'Procurando o totem...'}
            </div>
          )}
        </motion.div>

        {/* Estados especiais */}
        {status === 'nocode' && (
          <Notice
            title="Escaneie o QR no totem"
            text="Este controle pareia automaticamente ao ler o QR exibido na tela do totem. Abra a câmera e aponte para o código."
          />
        )}
        {status === 'busy' && (
          <Notice
            tone="warn"
            title="Sessão em uso"
            text="Outro celular já está controlando esta sessão. Aguarde liberar ou escaneie o novo QR do totem."
          />
        )}
        {status === 'loading' && (
          <Notice title="Conectando..." text="Pareando com a sessão do totem." />
        )}

        {/* Controle (só para o dono da sessão) */}
        {status === 'owned' && (
          <>
            {/* Fase atual */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mt-6 rounded-2xl p-4"
              style={{ background: 'rgba(0,30,60,0.5)', border: '1px solid rgba(0,212,255,0.18)' }}
            >
              <p className="text-[11px] uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(0,212,255,0.7)' }}>No totem agora</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={displayScreen}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="text-lg font-bold"
                >
                  {label(displayScreen)}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            {/* Ação contextual */}
            <div className="mt-5 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayScreen + (sent ? '-sent' : '')}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                >
                  {displayScreen === 'home' && (
                    <BigButton onClick={() => send({ type: 'start' })} glow>
                      Começar a jornada
                    </BigButton>
                  )}

                  {isPhase && (
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>
                        Terminou esta etapa no totem? Toque para avançar:
                      </p>
                      <BigButton onClick={() => send({ type: 'advance' })} glow>
                        Continuar
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </BigButton>
                    </div>
                  )}

                  {displayScreen === 'certificate' && (
                    sent ? (
                      <motion.div
                        initial={{ scale: 0.92 }} animate={{ scale: 1 }}
                        className="rounded-2xl p-6 text-center"
                        style={{ background: 'rgba(0,221,102,0.1)', border: '1px solid rgba(0,221,102,0.5)' }}
                      >
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3"
                          style={{ background: 'rgba(0,221,102,0.18)', border: '2px solid #00dd66' }}
                        >
                          <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#00dd66" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </motion.div>
                        <p className="text-lg font-bold" style={{ color: '#00dd66' }}>Certificado enviado!</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted, #7d93a8)' }}>Confira o WhatsApp. O totem já está pronto para o próximo.</p>
                      </motion.div>
                    ) : (
                      <div className="rounded-2xl p-4" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
                        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>Receba o certificado no seu WhatsApp:</p>
                        <Field value={name} onChange={setName} placeholder="Nome completo" />
                        <div className="h-3" />
                        <Field value={phone} onChange={setPhone} placeholder="WhatsApp com DDD" inputMode="tel" />
                        <div className="h-4" />
                        <BigButton onClick={sendCertificate} disabled={sending} glow>
                          {sending ? 'Enviando...' : 'Enviar certificado'}
                        </BigButton>
                        {certMsg && <p className="text-sm mt-3" style={{ color: '#ff9090' }}>{certMsg}</p>}
                      </div>
                    )
                  )}

                  {displayScreen === 'admin' && (
                    <p className="text-center text-sm py-6" style={{ color: 'var(--text-muted, #7d93a8)' }}>Painel aberto no totem.</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Reiniciar */}
            <button
              onClick={() => send({ type: 'restart' })}
              className="mt-6 w-full py-3 rounded-xl text-sm font-medium"
              style={{ border: '1px solid rgba(0,212,255,0.2)', color: 'rgba(155,200,230,0.9)', background: 'transparent' }}
            >
              Reiniciar sessão do totem
            </button>
          </>
        )}
      </div>
    </main>
  );
}

function Notice({ title, text, tone }: { title: string; text: string; tone?: 'warn' }) {
  const accent = tone === 'warn' ? '#ffaa00' : '#00d4ff';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="mt-10 rounded-2xl p-6 text-center"
      style={{ background: 'rgba(0,20,40,0.5)', border: `1px solid ${accent}33` }}
    >
      <p className="text-lg font-bold" style={{ color: accent }}>{title}</p>
      <p className="text-sm mt-2 leading-snug" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>{text}</p>
    </motion.div>
  );
}

function BigButton({ children, onClick, disabled, glow }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; glow?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      className="w-full flex items-center justify-center gap-2 rounded-xl font-bold"
      style={{
        padding: '16px',
        fontSize: 17,
        color: '#fff',
        background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
        boxShadow: glow ? '0 0 24px rgba(0,212,255,0.35)' : 'none',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </motion.button>
  );
}

function Field({ value, onChange, placeholder, inputMode }: { value: string; onChange: (v: string) => void; placeholder: string; inputMode?: 'tel' | 'text' }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className="w-full rounded-xl px-4 py-3 text-base outline-none"
      style={{ background: '#08121f', border: '1px solid rgba(0,212,255,0.2)', color: '#fff' }}
    />
  );
}

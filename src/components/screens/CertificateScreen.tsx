'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Screen } from '@/types';
import OnScreenKeyboard from '@/components/ui/OnScreenKeyboard';
import { useGame } from '@/context/GameProvider';

interface Props {
  onNavigate: (screen: Screen) => void;
  onComplete: () => void; // ativa o descanso de tela (reseta a sessão)
}

type Step = 'name' | 'phone' | 'sending' | 'success' | 'error';

function formatPhone(d: string): string {
  // exibe (DD) 9XXXX-XXXX conforme digita
  const n = d.replace(/\D/g, '');
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
}

export default function CertificateScreen({ onNavigate, onComplete }: Props) {
  const { markCertificateIssued, resetJourney } = useGame();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); // só dígitos
  const [errorMsg, setErrorMsg] = useState('');

  // Após o sucesso, volta ao descanso de tela sozinho (reseta a sessão)
  useEffect(() => {
    if (step !== 'success') return;
    const t = setTimeout(() => { resetJourney(); onComplete(); }, 9000);
    return () => clearTimeout(t);
  }, [step, resetJourney, onComplete]);

  const nameValid = name.trim().length >= 2;
  const phoneValid = phone.length >= 10 && phone.length <= 11;

  const submit = async () => {
    setStep('sending');
    try {
      const res = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone }),
      });
      const data = await res.json();
      if (data.ok) {
        markCertificateIssued();
        setStep('success');
      } else {
        setErrorMsg(
          data.error === 'whatsapp-not-connected'
            ? 'O WhatsApp do totem não está conectado. Chame um organizador.'
            : data.error === 'no-whatsapp'
            ? 'Esse número não tem WhatsApp. Confira e tente novamente.'
            : data.error === 'invalid-phone'
            ? 'Número inválido. Confira o DDD e o número.'
            : 'Não foi possível enviar agora. Tente novamente.'
        );
        setStep('error');
      }
    } catch {
      setErrorMsg('Falha de conexão. Tente novamente.');
      setStep('error');
    }
  };

  const finish = () => {
    resetJourney();
    onComplete(); // volta ao descanso de tela
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 overflow-y-auto py-6">
      <div className="w-full flex justify-center">
        {/* ─── NOME ─── */}
        {step === 'name' && (
          <motion.div key="name" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex flex-col items-center gap-5 w-full">
            <Header title="Seu Certificado" subtitle="Você completou a jornada! Digite seu nome como deve aparecer no certificado." />
            <Display value={name || 'Seu nome'} dim={!name} />
            <OnScreenKeyboard
              mode="text"
              onKey={(c) => setName((v) => (v.length < 40 ? v + c : v))}
              onBackspace={() => setName((v) => v.slice(0, -1))}
              onEnter={() => setStep('phone')}
              enterLabel="Próximo"
              enterDisabled={!nameValid}
            />
            <BackBtn onClick={() => onNavigate('home')} />
          </motion.div>
        )}

        {/* ─── TELEFONE ─── */}
        {step === 'phone' && (
          <motion.div key="phone" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex flex-col items-center gap-5 w-full">
            <Header title="Número do WhatsApp" subtitle="Com DDD. Enviaremos o certificado em PDF para esse número." />
            <Display value={phone ? formatPhone(phone) : '(DD) 9XXXX-XXXX'} dim={!phone} />
            <OnScreenKeyboard
              mode="numeric"
              onKey={(c) => setPhone((v) => (v.length < 11 ? v + c : v))}
              onBackspace={() => setPhone((v) => v.slice(0, -1))}
              onEnter={submit}
              enterLabel="Enviar certificado"
              enterDisabled={!phoneValid}
            />
            <button onClick={() => setStep('name')} className="btn btn-ghost text-xs">Voltar para o nome</button>
          </motion.div>
        )}

        {/* ─── ENVIANDO ─── */}
        {step === 'sending' && (
          <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
            <motion.div
              className="rounded-full"
              style={{ width: 70, height: 70, border: '4px solid rgba(0,212,255,0.2)', borderTopColor: '#00d4ff' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-lg font-semibold" style={{ color: '#00d4ff' }}>Gerando e enviando seu certificado...</p>
          </motion.div>
        )}

        {/* ─── SUCESSO ─── */}
        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-5 text-center">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="rounded-full flex items-center justify-center"
              style={{ width: 96, height: 96, background: 'rgba(0,221,102,0.15)', border: '2px solid #00dd66' }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#00dd66" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold" style={{ color: '#00dd66' }}>Certificado enviado!</h2>
            <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
              Enviamos o certificado em PDF para o WhatsApp <strong>{formatPhone(phone)}</strong>. Obrigado por participar, {name.trim()}!
            </p>
            <button onClick={finish} className="btn btn-primary" style={{ padding: '12px 28px' }}>Concluir</button>
          </motion.div>
        )}

        {/* ─── ERRO ─── */}
        {step === 'error' && (
          <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-5 text-center">
            <div className="rounded-full flex items-center justify-center" style={{ width: 90, height: 90, background: 'rgba(255,80,80,0.12)', border: '2px solid #ff5050' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v5M12 17h.01" stroke="#ff5050" strokeWidth="3" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="#ff5050" strokeWidth="2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#ff7070' }}>Ops!</h2>
            <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>{errorMsg}</p>
            <div className="flex gap-3">
              <button onClick={() => setStep('phone')} className="btn btn-primary" style={{ padding: '10px 22px' }}>Tentar novamente</button>
              <button onClick={() => onNavigate('home')} className="btn btn-ghost">Voltar ao menu</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center max-w-lg">
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#00d4ff' }}>{title}</h1>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
    </div>
  );
}

function Display({ value, dim }: { value: string; dim: boolean }) {
  return (
    <div
      className="px-6 py-3 rounded-xl text-center font-semibold"
      style={{
        minWidth: 320,
        fontSize: 24,
        letterSpacing: 0.5,
        background: 'rgba(0,20,40,0.6)',
        border: '1px solid rgba(0,212,255,0.3)',
        color: dim ? 'var(--text-muted)' : 'var(--text-primary)',
      }}
    >
      {value}
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn btn-ghost text-xs">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Voltar ao menu
    </button>
  );
}

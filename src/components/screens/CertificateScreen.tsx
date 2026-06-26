'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '@/types';
import { useGame } from '@/context/GameProvider';

interface Props {
  onNavigate: (screen: Screen) => void;
  onComplete: () => void; // reinicia a sessão (limpa progresso, volta ao início)
}

type Step = 'waiting' | 'success';

export default function CertificateScreen({ onNavigate, onComplete }: Props) {
  const { markCertificateIssued, resetJourney } = useGame();
  const [step, setStep] = useState<Step>('waiting');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [name, setName] = useState('');

  // O preenchimento e o envio acontecem no CELULAR (controle). Quando o celular
  // confirma o envio, o totem reconhece via evento e mostra o sucesso.
  useEffect(() => {
    const onSent = (e: Event) => {
      const detail = (e as CustomEvent<{ channel?: string; name?: string }>).detail || {};
      setChannel(detail.channel === 'email' ? 'email' : 'whatsapp');
      setName((detail.name || '').trim());
      markCertificateIssued();
      setStep('success');
    };
    window.addEventListener('detetive:cert-sent', onSent);
    return () => window.removeEventListener('detetive:cert-sent', onSent);
  }, [markCertificateIssued]);

  // Sucesso → aguarda alguns segundos e reinicia a sessão SOZINHO.
  useEffect(() => {
    if (step !== 'success') return;
    const t = setTimeout(() => { resetJourney(); onComplete(); }, 6000);
    return () => clearTimeout(t);
  }, [step, resetJourney, onComplete]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 overflow-y-auto py-6">
      <AnimatePresence mode="wait">
        {/* ─── AGUARDANDO O PREENCHIMENTO NO CELULAR ─── */}
        {step === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-6 text-center max-w-lg"
          >
            {/* Selo de jornada concluída */}
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 16 }}
              className="rounded-full flex items-center justify-center"
              style={{ width: 96, height: 96, background: 'rgba(0,212,255,0.12)', border: '2px solid #00d4ff' }}
            >
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
                <path d="M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="#00d4ff" strokeWidth="1.8" />
                <path d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5" stroke="#00d4ff" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </motion.div>

            <div>
              <h1 className="text-3xl font-black" style={{ color: '#00d4ff' }}>Investigação concluída!</h1>
              <p className="text-base mt-2" style={{ color: 'var(--text-secondary)' }}>
                Você completou todas as fases. Agora pegue o seu certificado pelo celular.
              </p>
            </div>

            {/* Passos no celular */}
            <div
              className="w-full rounded-2xl p-5 flex flex-col gap-3 text-left"
              style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.2)' }}
            >
              <PhoneStep n={1} text="Pegue o celular que você usou para conduzir a jornada." />
              <PhoneStep n={2} text="Digite o seu nome e escolha WhatsApp ou email." />
              <PhoneStep n={3} text="Toque em Enviar — o certificado chega na hora." />
            </div>

            {/* Indicador de espera */}
            <div className="flex items-center gap-3" style={{ color: '#00d4ff' }}>
              <span className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: 'currentColor' }}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </span>
              <span className="text-sm font-semibold">Aguardando você preencher no celular...</span>
            </div>

            <button onClick={() => onNavigate('home')} className="btn btn-ghost text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Voltar ao início
            </button>
          </motion.div>
        )}

        {/* ─── SUCESSO (reinicia sozinho) ─── */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="rounded-full flex items-center justify-center"
              style={{ width: 96, height: 96, background: 'rgba(0,221,102,0.15)', border: '2px solid #00dd66' }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#00dd66" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold" style={{ color: '#00dd66' }}>
              {channel === 'email' ? 'Email registrado!' : 'Certificado enviado!'}
            </h2>
            <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
              {channel === 'email'
                ? <>Anotamos o seu email. O certificado será enviado em breve. Obrigado por participar{name ? `, ${name}` : ''}!</>
                : <>Enviamos o certificado em PDF para o seu WhatsApp. Obrigado por participar{name ? `, ${name}` : ''}!</>}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Voltando para o início...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhoneStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: 'rgba(0,212,255,0.18)', color: '#00d4ff' }}
      >
        {n}
      </span>
      <p className="text-sm pt-0.5" style={{ color: 'var(--text-secondary)' }}>{text}</p>
    </div>
  );
}

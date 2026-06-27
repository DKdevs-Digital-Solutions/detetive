'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeId } from '@/types';
import { JOURNEY, PHASE_LABELS, BADGES } from '@/lib/game';
import Avatar from '@/components/ui/Avatar';
import BadgeSeal from '@/components/ui/BadgeSeal';
import SealCelebration from '@/components/ui/SealCelebration';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const EXTRA_LABEL: Record<string, string> = {
  home: 'Tela inicial',
  certificate: 'Hora do certificado',
  admin: 'Painel administrativo',
};

function label(screen: string): string {
  return PHASE_LABELS[screen] || EXTRA_LABEL[screen] || 'Acompanhe no totem';
}

type Status = 'loading' | 'nocode' | 'busy' | 'owned';

interface QuizInfo {
  state: 'intro' | 'question' | 'analyzing' | 'result';
  index: number;
  total: number;
  question: string;
  options: string[];
  canAnswer: boolean;
  selected: number | null;
  correct: number;
  explanation: string;
  score: number;
  pct: number;
}

type NewsLevel = 'green' | 'yellow' | 'red';

interface NewsInfo {
  caseIndex: number;
  total: number;
  canVote: boolean;
  selected: NewsLevel | null;
  revealed: boolean;
  correctLevel: NewsLevel | null;
  done: boolean;
}

interface AIErrInfo {
  caseIndex: number;
  total: number;
  canVote: boolean;
  selected: boolean | null;
  revealed: boolean;
  aiCorrect: boolean | null;
  done: boolean;
}

export default function ControlPage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('loading');
  const [displayScreen, setDisplayScreen] = useState<string>('home');
  const [displayReady, setDisplayReady] = useState(false);
  const [online, setOnline] = useState(false);

  // Selos espelhados do totem + animação de conquista.
  const [badges, setBadges] = useState<BadgeId[]>([]);
  const [celebration, setCelebration] = useState<BadgeId | null>(null);

  // Cabine de fotos: estado espelhado do totem + decisão de pular.
  const [photoState, setPhotoState] = useState<'idle' | 'live' | 'captured' | 'attached' | 'error'>('idle');
  const [photoSkipped, setPhotoSkipped] = useState(false);

  // Quiz: espelho do estado do totem (o quiz é respondido aqui no celular).
  const [quiz, setQuiz] = useState<QuizInfo | null>(null);

  // Notícias: o visitante dá o veredito pelo celular.
  const [news, setNews] = useState<NewsInfo | null>(null);

  // "A IA acertou ou errou?": julgamento pelo celular.
  const [aierr, setAierr] = useState<AIErrInfo | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
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
          setDisplayReady(!!cmd.ready);
          if (Array.isArray(cmd.badges)) setBadges(cmd.badges);
          if (cmd.screen !== 'certificate') {
            setSent(false); setCertMsg('');
            setPhotoState('idle'); setPhotoSkipped(false);
          }
          if (cmd.screen !== 'quiz') setQuiz(null);
          if (cmd.screen !== 'news') setNews(null);
          if (cmd.screen !== 'ai-errors') setAierr(null);
        } else if (cmd?.from === 'display' && cmd.type === 'badge' && cmd.badge) {
          setCelebration(cmd.badge);
          setBadges((prev) => (prev.includes(cmd.badge) ? prev : [...prev, cmd.badge]));
        } else if (cmd?.from === 'display' && cmd.type === 'photo-state' && cmd.photoState) {
          setPhotoState(cmd.photoState);
        } else if (cmd?.from === 'display' && cmd.type === 'quiz-state' && cmd.quiz) {
          setQuiz(cmd.quiz);
        } else if (cmd?.from === 'display' && cmd.type === 'news-state' && cmd.news) {
          setNews(cmd.news);
        } else if (cmd?.from === 'display' && cmd.type === 'aierr-state' && cmd.aierr) {
          setAierr(cmd.aierr);
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

  // Limpa a animação do selo conquistado após o tempo de exibição.
  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(() => setCelebration(null), 3000);
    return () => clearTimeout(t);
  }, [celebration]);

  const sendCertificate = async () => {
    if (!name.trim()) { setCertMsg('Digite o seu nome.'); return; }
    if (channel === 'whatsapp' && phone.replace(/\D/g, '').length < 10) {
      setCertMsg('Número inválido (com DDD).');
      return;
    }
    if (channel === 'email' && !EMAIL_RE.test(email.trim())) {
      setCertMsg('Email inválido.');
      return;
    }
    setSending(true);
    setCertMsg('');
    try {
      const body = channel === 'whatsapp'
        ? { name: name.trim(), phone: phone.trim(), code }
        : { name: name.trim(), email: email.trim(), code };
      const r = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.ok) {
        setSent(true);
        // Avisa o totem para reconhecer o envio e mostrar o sucesso.
        send({ type: 'cert-sent', channel, name: name.trim() });
      } else {
        setCertMsg(
          d.error === 'whatsapp-not-connected' ? 'WhatsApp do totem não conectado. Chame um organizador.'
          : d.error === 'no-whatsapp' ? 'Esse número não tem WhatsApp. Tente por email.'
          : d.error === 'invalid-phone' ? 'Número inválido. Confira o DDD.'
          : d.error === 'invalid-email' ? 'Email inválido. Confira e tente de novo.'
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

            {/* Selos da jornada (espelhados do totem) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="mt-3 rounded-2xl p-3"
              style={{ background: 'rgba(0,20,40,0.4)', border: '1px solid rgba(0,212,255,0.12)' }}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'rgba(0,212,255,0.7)' }}>Selos</p>
                <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted, #7d93a8)' }}>{badges.length}/{BADGES.length}</p>
              </div>
              <div className="flex items-center justify-between gap-1">
                {BADGES.map((b) => (
                  <div key={b.id} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                    <BadgeSeal id={b.id} color={b.color} earned={badges.includes(b.id)} size={42} />
                    <span className="text-[9px] leading-tight text-center" style={{ color: badges.includes(b.id) ? b.color : 'var(--text-muted, #56697d)' }}>{b.short}</span>
                  </div>
                ))}
              </div>
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

                  {isPhase && displayScreen === 'quiz' && (
                    <QuizControl quiz={quiz} send={send} displayReady={displayReady} />
                  )}

                  {isPhase && displayScreen === 'news' && (
                    <NewsControl news={news} send={send} displayReady={displayReady} />
                  )}

                  {isPhase && displayScreen === 'ai-errors' && (
                    <AIErrControl aierr={aierr} send={send} displayReady={displayReady} />
                  )}

                  {isPhase && displayScreen !== 'quiz' && displayScreen !== 'news' && displayScreen !== 'ai-errors' && (
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>
                        {displayReady
                          ? 'Etapa concluída no totem. Toque para avançar:'
                          : 'O totem ainda está apresentando esta etapa. Aguarde terminar...'}
                      </p>
                      <BigButton onClick={() => send({ type: 'advance' })} disabled={!displayReady} glow={displayReady}>
                        {displayReady ? (
                          <>
                            Continuar
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </>
                        ) : (
                          <>
                            <motion.span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: 'currentColor' }}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                            />
                            Aguarde o totem
                          </>
                        )}
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
                        <p className="text-lg font-bold" style={{ color: '#00dd66' }}>{channel === 'email' ? 'Email registrado!' : 'Certificado enviado!'}</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted, #7d93a8)' }}>
                          {channel === 'email' ? 'Você receberá o certificado em breve.' : 'Confira o seu WhatsApp.'} O totem já está pronto para o próximo.
                        </p>
                      </motion.div>
                    ) : (!photoSkipped && photoState !== 'attached') ? (
                      <PhotoBooth photoState={photoState} send={send} onSkip={() => setPhotoSkipped(true)} />
                    ) : (
                      <div className="rounded-2xl p-4" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
                        {photoState === 'attached' && (
                          <div className="flex items-center justify-between gap-2 mb-3 rounded-xl px-3 py-2" style={{ background: 'rgba(0,221,102,0.1)', border: '1px solid rgba(0,221,102,0.35)' }}>
                            <span className="text-sm font-semibold" style={{ color: '#00dd66' }}>Foto anexada</span>
                            <button onClick={() => send({ type: 'photo-start' })} className="text-xs underline" style={{ color: 'rgba(155,200,230,0.9)' }}>Refazer</button>
                          </div>
                        )}
                        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>Preencha para receber o seu certificado:</p>
                        <Field value={name} onChange={setName} placeholder="Nome completo" />
                        <div className="h-3" />

                        {/* Escolha do canal */}
                        <div className="flex gap-2 mb-3">
                          <ChannelTab active={channel === 'whatsapp'} onClick={() => { setChannel('whatsapp'); setCertMsg(''); }} label="WhatsApp" />
                          <ChannelTab active={channel === 'email'} onClick={() => { setChannel('email'); setCertMsg(''); }} label="Email" />
                        </div>

                        {channel === 'whatsapp' ? (
                          <Field value={phone} onChange={setPhone} placeholder="WhatsApp com DDD" inputMode="tel" />
                        ) : (
                          <Field value={email} onChange={setEmail} placeholder="seu@email.com" inputMode="text" />
                        )}
                        {channel === 'email' && photoState === 'attached' && (
                          <p className="text-xs mt-2" style={{ color: 'var(--text-muted, #7d93a8)' }}>A foto recordação é enviada apenas pelo WhatsApp.</p>
                        )}
                        <div className="h-4" />
                        <BigButton onClick={sendCertificate} disabled={sending} glow>
                          {sending ? 'Enviando...' : channel === 'whatsapp' ? 'Enviar certificado' : 'Registrar email'}
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
          </>
        )}
      </div>

      {/* Animação do selo conquistado (mesma do totem) */}
      <AnimatePresence>
        {celebration && <SealCelebration badge={celebration} />}
      </AnimatePresence>
    </main>
  );
}

function QuizControl({ quiz, send, displayReady }: { quiz: QuizInfo | null; send: (c: Record<string, unknown>) => void; displayReady: boolean }) {
  // Sem estado ainda (acabou de entrar na fase) → oferece iniciar.
  if (!quiz || quiz.state === 'intro') {
    return (
      <div className="rounded-2xl p-4" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <p className="text-base font-bold mb-1" style={{ color: '#00d4ff' }}>Quiz Detetive IA</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>
          10 perguntas. O Detetive lê cada uma no totem e você responde aqui.
        </p>
        <BigButton onClick={() => send({ type: 'quiz-start' })} glow>Iniciar Quiz</BigButton>
      </div>
    );
  }

  if (quiz.state === 'analyzing') {
    return (
      <div className="rounded-2xl p-6 text-center flex flex-col items-center gap-4" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <motion.div
          className="rounded-full"
          style={{ width: 48, height: 48, border: '4px solid rgba(0,212,255,0.2)', borderTopColor: '#00d4ff' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-base font-bold" style={{ color: '#00d4ff' }}>Analisando suas respostas...</p>
      </div>
    );
  }

  if (quiz.state === 'result') {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>Sua pontuação</p>
        <p className="text-3xl font-black my-1" style={{ color: '#00d4ff' }}>{quiz.score}/{quiz.total}</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted, #7d93a8)' }}>{quiz.pct}% de acertos</p>
        <BigButton onClick={() => send({ type: 'advance' })} disabled={!displayReady} glow={displayReady}>
          Continuar
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </BigButton>
      </div>
    );
  }

  // state === 'question' — no celular mostramos SÓ as letras (a pergunta está no totem)
  const answered = quiz.selected !== null;
  const cols = Math.min(quiz.options.length || 3, 3);
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
      <p className="text-[11px] uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(0,212,255,0.7)' }}>
        Pergunta {quiz.index + 1} de {quiz.total}
      </p>
      <p className="text-sm mb-4 font-semibold" style={{ color: answered ? (quiz.selected === quiz.correct ? '#00dd44' : '#ffaa00') : '#00d4ff' }}>
        {answered
          ? (quiz.selected === quiz.correct ? 'Correto! 🎉' : 'Quase! Veja no totem.')
          : (quiz.canAnswer ? 'Toque na sua resposta (a pergunta está no totem):' : 'Ouça o Detetive ler a pergunta no totem...')}
      </p>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {quiz.options.map((_, idx) => {
          const isCorrect = answered && idx === quiz.correct;
          const isWrongPick = answered && idx === quiz.selected && idx !== quiz.correct;
          const disabled = !quiz.canAnswer || answered;
          let border = 'rgba(0,212,255,0.3)';
          let bg = 'rgba(0,30,60,0.6)';
          let color = '#00d4ff';
          if (isCorrect) { border = '#00dd44'; bg = 'rgba(0,221,68,0.18)'; color = '#fff'; }
          else if (isWrongPick) { border = '#ff3344'; bg = 'rgba(255,51,68,0.18)'; color = '#fff'; }
          return (
            <button
              key={idx}
              onClick={disabled ? undefined : () => send({ type: 'quiz-select', idx })}
              className="aspect-square rounded-2xl flex items-center justify-center font-black"
              style={{
                fontSize: 'clamp(28px, 12vw, 52px)',
                background: bg,
                border: `2px solid ${border}`,
                color,
                opacity: disabled && !isCorrect && !isWrongPick ? 0.5 : 1,
              }}
            >
              {isCorrect ? '✓' : isWrongPick ? '✗' : String.fromCharCode(65 + idx)}
            </button>
          );
        })}
      </div>

      {answered && (
        <>
          <div className="h-4" />
          <BigButton onClick={() => send({ type: 'quiz-next' })} glow>
            {quiz.index < quiz.total - 1 ? 'Próxima pergunta' : 'Ver resultado'}
          </BigButton>
        </>
      )}
    </div>
  );
}

const NEWS_LEVELS: { level: NewsLevel; label: string; emoji: string; color: string }[] = [
  { level: 'green', label: 'Confiável', emoji: '🟢', color: '#00dd44' },
  { level: 'yellow', label: 'Atenção', emoji: '🟡', color: '#ffaa00' },
  { level: 'red', label: 'Suspeita', emoji: '🔴', color: '#ff3344' },
];

function NewsControl({ news, send, displayReady }: { news: NewsInfo | null; send: (c: Record<string, unknown>) => void; displayReady: boolean }) {
  if (!news || news.done) {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <p className="text-base font-bold mb-1" style={{ color: '#00d4ff' }}>Casos resolvidos! 🕵️</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>Bom faro, detetive. Siga para a próxima fase.</p>
        <BigButton onClick={() => send({ type: 'advance' })} disabled={!displayReady} glow={displayReady}>
          Continuar
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </BigButton>
      </div>
    );
  }

  const correct = news.revealed && news.selected === news.correctLevel;
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
      <p className="text-[11px] uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(0,212,255,0.7)' }}>
        Caso {news.caseIndex + 1} de {news.total}
      </p>
      <p className="text-sm mb-4 font-semibold" style={{ color: news.revealed ? (correct ? '#00dd44' : '#ffaa00') : '#00d4ff' }}>
        {news.revealed
          ? (correct ? 'Veredito certo! 🎉' : 'Quase! Veja as pistas no totem.')
          : (news.canVote ? 'Leia no totem e dê o seu veredito:' : 'O Detetive está lendo o caso...')}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {NEWS_LEVELS.map((l) => {
          const isPicked = news.selected === l.level;
          const isAnswer = news.revealed && news.correctLevel === l.level;
          const disabled = !news.canVote || news.revealed;
          let border = `${l.color}66`;
          let bg = 'rgba(0,30,60,0.6)';
          if (isAnswer) { border = l.color; bg = `${l.color}28`; }
          else if (isPicked && !isAnswer) { border = '#ff3344'; bg = 'rgba(255,51,68,0.18)'; }
          return (
            <button
              key={l.level}
              onClick={disabled ? undefined : () => send({ type: 'news-vote', level: l.level })}
              className="rounded-2xl py-4 flex flex-col items-center gap-1"
              style={{ background: bg, border: `2px solid ${border}`, opacity: disabled && !isAnswer && !isPicked ? 0.5 : 1 }}
            >
              <span style={{ fontSize: 'clamp(26px, 9vw, 40px)' }}>{l.emoji}</span>
              <span className="text-xs font-bold" style={{ color: l.color }}>{l.label}</span>
            </button>
          );
        })}
      </div>

      {news.revealed && (
        <>
          <div className="h-4" />
          <BigButton onClick={() => send({ type: 'news-next' })} glow>
            {news.caseIndex < news.total - 1 ? 'Próximo caso' : 'Concluir'}
          </BigButton>
        </>
      )}
    </div>
  );
}

function AIErrControl({ aierr, send, displayReady }: { aierr: AIErrInfo | null; send: (c: Record<string, unknown>) => void; displayReady: boolean }) {
  if (!aierr || aierr.done) {
    return (
      <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <p className="text-base font-bold mb-1" style={{ color: '#00d4ff' }}>Investigação concluída! 🤖</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>Você aprendeu a desconfiar das respostas da IA. Siga em frente.</p>
        <BigButton onClick={() => send({ type: 'advance' })} disabled={!displayReady} glow={displayReady}>
          Continuar
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </BigButton>
      </div>
    );
  }

  const correct = aierr.revealed && aierr.selected === aierr.aiCorrect;
  const opts: { value: boolean; label: string; emoji: string; color: string }[] = [
    { value: true, label: 'Acertou', emoji: '✅', color: '#00dd44' },
    { value: false, label: 'Errou', emoji: '❌', color: '#ff3344' },
  ];
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
      <p className="text-[11px] uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(0,212,255,0.7)' }}>
        Caso {aierr.caseIndex + 1} de {aierr.total}
      </p>
      <p className="text-sm mb-4 font-semibold" style={{ color: aierr.revealed ? (correct ? '#00dd44' : '#ffaa00') : '#00d4ff' }}>
        {aierr.revealed
          ? (correct ? 'Veredito certo! 🎉' : 'Quase! Veja a explicação no totem.')
          : (aierr.canVote ? 'Leia a resposta no totem. A IA acertou?' : 'O Detetive está lendo o caso...')}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {opts.map((o) => {
          const isPicked = aierr.selected === o.value;
          const isAnswer = aierr.revealed && aierr.aiCorrect === o.value;
          const disabled = !aierr.canVote || aierr.revealed;
          let border = `${o.color}66`;
          let bg = 'rgba(0,30,60,0.6)';
          if (isAnswer) { border = o.color; bg = `${o.color}28`; }
          else if (isPicked && !isAnswer) { border = '#ff3344'; bg = 'rgba(255,51,68,0.18)'; }
          return (
            <button
              key={String(o.value)}
              onClick={disabled ? undefined : () => send({ type: 'aierr-vote', value: o.value })}
              className="rounded-2xl py-4 flex flex-col items-center gap-1"
              style={{ background: bg, border: `2px solid ${border}`, opacity: disabled && !isAnswer && !isPicked ? 0.5 : 1 }}
            >
              <span style={{ fontSize: 'clamp(26px, 9vw, 40px)' }}>{o.emoji}</span>
              <span className="text-sm font-bold" style={{ color: o.color }}>{o.label}</span>
            </button>
          );
        })}
      </div>

      {aierr.revealed && (
        <>
          <div className="h-4" />
          <BigButton onClick={() => send({ type: 'aierr-next' })} glow>
            {aierr.caseIndex < aierr.total - 1 ? 'Próximo caso' : 'Concluir'}
          </BigButton>
        </>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

type BoothState = 'idle' | 'live' | 'captured' | 'attached' | 'error';

function PhotoBooth({ photoState, send, onSkip }: { photoState: BoothState; send: (c: Record<string, unknown>) => void; onSkip: () => void }) {
  const GhostBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="mt-3 w-full py-3 rounded-xl text-sm font-medium"
      style={{ border: '1px solid rgba(0,212,255,0.2)', color: 'rgba(155,200,230,0.9)', background: 'transparent' }}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
      {photoState === 'idle' && (
        <>
          <p className="text-base font-bold mb-1" style={{ color: '#00d4ff' }}>Quer uma foto recordação?</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>
            A câmera do totem tira uma polaroid com o tema da Feira — ela vai junto no seu WhatsApp.
          </p>
          <BigButton onClick={() => send({ type: 'photo-start' })} glow>
            <CameraIcon /> Tirar foto
          </BigButton>
          <GhostBtn onClick={() => { onSkip(); send({ type: 'photo-skip' }); }}>Pular, ir ao certificado</GhostBtn>
        </>
      )}

      {photoState === 'live' && (
        <>
          <p className="text-base font-bold mb-1" style={{ color: '#00d4ff' }}>Posicione-se em frente ao totem</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>Quando estiver pronto, dispare — conta 3, 2, 1.</p>
          <BigButton onClick={() => send({ type: 'photo-shoot' })} glow>
            <CameraIcon /> Disparar
          </BigButton>
          <GhostBtn onClick={() => send({ type: 'photo-skip' })}>Cancelar</GhostBtn>
        </>
      )}

      {photoState === 'captured' && (
        <>
          <p className="text-base font-bold mb-1" style={{ color: '#00d4ff' }}>Foto tirada!</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>Veja a prévia no totem. Quer usar esta ou refazer?</p>
          <BigButton onClick={() => send({ type: 'photo-confirm' })} glow>Usar esta foto</BigButton>
          <GhostBtn onClick={() => send({ type: 'photo-retake' })}>Refazer</GhostBtn>
        </>
      )}

      {photoState === 'error' && (
        <>
          <p className="text-base font-bold mb-1" style={{ color: '#ffaa00' }}>Câmera indisponível</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #9fb6cc)' }}>Não consegui usar a câmera do totem. Você pode seguir sem foto.</p>
          <BigButton onClick={() => { onSkip(); send({ type: 'photo-skip' }); }} glow>Continuar sem foto</BigButton>
        </>
      )}
    </div>
  );
}

function ChannelTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
      style={{
        background: active ? 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,102,255,0.25))' : 'rgba(0,20,40,0.4)',
        border: `1px solid ${active ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.15)'}`,
        color: active ? '#fff' : 'var(--text-secondary, #9fb6cc)',
      }}
    >
      {label}
    </button>
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

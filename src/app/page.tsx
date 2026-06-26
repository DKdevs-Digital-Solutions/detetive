'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Screen, BadgeId } from '@/types';
import HomeScreen from '@/components/screens/HomeScreen';
import ConversationScreen from '@/components/screens/ConversationScreen';
import NewsAnalyzerScreen from '@/components/screens/NewsAnalyzerScreen';
import QuizScreen from '@/components/screens/QuizScreen';
import ChecklistScreen from '@/components/screens/ChecklistScreen';
import AIErrorsScreen from '@/components/screens/AIErrorsScreen';
import AdminScreen from '@/components/screens/AdminScreen';
import CertificateScreen from '@/components/screens/CertificateScreen';
import StatusBar from '@/components/ui/StatusBar';
import JourneyProgress from '@/components/ui/JourneyProgress';
import SealCelebration from '@/components/ui/SealCelebration';
import SettingsMenu from '@/components/ui/SettingsMenu';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import { GameProvider, useGame } from '@/context/GameProvider';
import { SettingsProvider, useSettings } from '@/context/SettingsProvider';
import { JOURNEY } from '@/lib/game';
import { PRAISE } from '@/data/narration';

// Código curto e único por sessão. Vira o "endereço" do controle remoto e expira
// (gera-se outro) sempre que a sessão reinicia — trava o controle a uma sessão.
const genCode = () => Math.random().toString(36).slice(2, 7).toUpperCase();

export default function App() {
  return (
    <SettingsProvider>
      <GameProvider>
        <AppShell />
      </GameProvider>
    </SettingsProvider>
  );
}

function AppShell() {
  const { idleSeconds, sound } = useSettings();
  const { grantBadge, resetJourney } = useGame();
  const { playClip, stop: stopSpeak } = useElevenLabsSpeech();

  const [screen, setScreen] = useState<Screen>('home');
  const [isOnline, setIsOnline] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [speechBusy, setSpeechBusy] = useState(false);
  const [celebration, setCelebration] = useState<BadgeId | null>(null);

  const inJourney = JOURNEY.includes(screen);

  const screenRef = useRef<Screen>('home');
  useEffect(() => { screenRef.current = screen; }, [screen]);

  // Prontidão da fase: cada tela da jornada avisa quando terminou seus processos
  // (narração/quiz/etc.) e pode avançar. Trava o "Continuar" do controle até lá.
  const [phaseReady, setPhaseReady] = useState(false);
  const phaseReadyRef = useRef(false);
  useEffect(() => { phaseReadyRef.current = phaseReady; }, [phaseReady]);
  useEffect(() => { setPhaseReady(false); }, [screen]); // toda troca de tela começa "não pronta"
  useEffect(() => {
    const onReady = (e: Event) => setPhaseReady(!!(e as CustomEvent<{ ready?: boolean }>).detail?.ready);
    window.addEventListener('detetive:phase-ready', onReady);
    return () => window.removeEventListener('detetive:phase-ready', onReady);
  }, []);

  // Sessão do controle remoto (código por sessão, lido pelo QR na Home).
  const [sessionCode, setSessionCode] = useState('');
  const sessionCodeRef = useRef('');
  useEffect(() => { sessionCodeRef.current = sessionCode; }, [sessionCode]);
  useEffect(() => { setSessionCode(genCode()); }, []);

  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const controlUrl = origin && sessionCode ? `${origin}/controle?code=${sessionCode}` : '';

  // Selos CONCLUÍDOS (no FIM de cada fase, via advanceFrom) — espelhados no controle.
  const [completedBadges, setCompletedBadges] = useState<BadgeId[]>([]);
  const completedRef = useRef<BadgeId[]>([]);
  useEffect(() => { completedRef.current = completedBadges; }, [completedBadges]);

  // Controle conectado? Ao parear um celular, escondemos o QR do totem (evita
  // outro acesso); o QR reaparece só em nova sessão.
  const [controllerConnected, setControllerConnected] = useState(false);

  // Estado global de fala: qualquer tela pode bloquear o reconhecimento de ordens
  // enquanto o Detetive estiver lendo ou respondendo.
  useEffect(() => {
    const activeSpeech = new Set<string>();
    const update = () => setSpeechBusy(activeSpeech.size > 0);
    const onStart = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id || 'unknown';
      activeSpeech.add(id);
      update();
    };
    const onEnd = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id || 'unknown';
      activeSpeech.delete(id);
      update();
    };

    window.addEventListener('detetive:speech-start', onStart);
    window.addEventListener('detetive:speech-end', onEnd);
    return () => {
      window.removeEventListener('detetive:speech-start', onStart);
      window.removeEventListener('detetive:speech-end', onEnd);
    };
  }, []);

  // ─── Navegação ───────────────────────────────────────────────────────────────
  const navigate = useCallback((s: Screen) => {
    stopSpeak();
    setScreen(s);
  }, [stopSpeak]);

  // Começa a jornada na primeira fase.
  const startJourney = useCallback(() => navigate(JOURNEY[0]), [navigate]);

  // Avança para a próxima fase com celebração do selo (Detetive fala "parabéns").
  const advanceFrom = useCallback((from: Screen) => {
    const i = JOURNEY.indexOf(from);
    const next: Screen = i === -1 || i === JOURNEY.length - 1 ? 'certificate' : JOURNEY[i + 1];
    setPhaseReady(false); // trava o "Continuar" do controle durante a transição
    grantBadge(from as BadgeId);
    setCompletedBadges((prev) => (prev.includes(from as BadgeId) ? prev : [...prev, from as BadgeId]));
    stopSpeak();
    setCelebration(from as BadgeId);
    // Espelha a conquista do selo no controle (mesma animação).
    const code = sessionCodeRef.current;
    if (code) {
      fetch('/api/control/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, command: { from: 'display', type: 'badge', badge: from } }),
      }).catch(() => {});
    }
    if (sound) {
      const i = Math.floor(Math.random() * PRAISE.length);
      playClip(`praise-${i}`, PRAISE[i]);
    }
    window.setTimeout(() => {
      setCelebration(null);
      setScreen(next);
    }, 3000);
  }, [grantBadge, sound, playClip, stopSpeak]);

  // ─── Inatividade → reinicia a sessão ─────────────────────────────────────────
  // Substitui o antigo descanso de tela: ao ficar ocioso, limpa o progresso do
  // visitante e volta para a tela inicial (sessão zerada para o próximo).
  const restartSession = useCallback(() => {
    stopSpeak();
    setCelebration(null);
    resetJourney();
    setScreen('home');
    setSessionCode(genCode()); // nova sessão → novo QR; o controle anterior expira
    setCompletedBadges([]);
    setControllerConnected(false); // nova sessão → QR reaparece no totem
  }, [resetJourney, stopSpeak]);

  // Timer de inatividade (configurável; 0 = desligado)
  useEffect(() => {
    if (!idleSeconds || idleSeconds <= 0 || speechBusy) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const reset = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => restartSession(), idleSeconds * 1000);
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart', 'mousemove'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    // Mantém acordado durante atividades autônomas (ex.: o Detetive narrando)
    window.addEventListener('detetive:keepalive', reset);
    reset();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
      window.removeEventListener('detetive:keepalive', reset);
    };
  }, [idleSeconds, restartSession, speechBusy]);

  // Esc volta ao início (navegação)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !speechBusy) setScreen('home');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [speechBusy]);

  // Online/offline
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    fetch('/api/log', { method: 'POST', body: JSON.stringify({ type: 'visitor' }) }).catch(() => {});
    // Inicia o Baileys ao abrir o totem, sem depender de alguém entrar no painel admin.
    fetch('/api/whatsapp').catch(() => {});
  }, []);

  // ─── Controle remoto (celular do visitante, código por sessão lido via QR) ────
  // O controlador (/controle?code=...) acompanha a jornada e envia ações sequenciais.
  const handleControl = useCallback((cmd: { type?: string; screen?: Screen; channel?: string; name?: string; idx?: number }) => {
    window.dispatchEvent(new Event('detetive:keepalive'));
    if (cmd.type === 'start') {
      startJourney();
    } else if (cmd.type === 'advance') {
      const s = screenRef.current;
      // Só avança se a fase atual já terminou seus processos (defesa no display).
      if (JOURNEY.includes(s) && phaseReadyRef.current) advanceFrom(s);
    } else if (cmd.type === 'restart') {
      restartSession();
    } else if (cmd.type === 'navigate' && cmd.screen) {
      navigate(cmd.screen);
    } else if (cmd.type === 'cert-sent') {
      // O celular enviou o certificado: o totem reconhece e mostra o sucesso.
      window.dispatchEvent(new CustomEvent('detetive:cert-sent', { detail: { channel: cmd.channel, name: cmd.name } }));
    } else if (cmd.type && cmd.type.startsWith('photo-')) {
      // Cabine de fotos: o celular comanda; a webcam é a do totem.
      window.dispatchEvent(new CustomEvent('detetive:photo', { detail: { action: cmd.type } }));
    } else if (cmd.type && cmd.type.startsWith('quiz-')) {
      // Quiz respondido pelo celular: encaminha a ação para a tela do quiz.
      window.dispatchEvent(new CustomEvent('detetive:quiz', { detail: { action: cmd.type.slice(5), idx: cmd.idx } }));
    } else if (cmd.type === 'hello') {
      setControllerConnected(true); // celular pareou → some o QR do totem
      fetch('/api/control/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sessionCodeRef.current, command: { from: 'display', type: 'state', screen: screenRef.current, ready: phaseReadyRef.current, badges: completedRef.current } }),
      }).catch(() => {});
    }
  }, [startJourney, advanceFrom, restartSession, navigate]);

  const handleControlRef = useRef(handleControl);
  useEffect(() => { handleControlRef.current = handleControl; }, [handleControl]);

  // Escuta os comandos do controlador na sala da sessão atual (re-assina ao trocar).
  useEffect(() => {
    if (!sessionCode) return;
    const es = new EventSource(`/api/control/stream?code=${encodeURIComponent(sessionCode)}`);
    es.onmessage = (e) => {
      try {
        const cmd = JSON.parse(e.data);
        if (!cmd || cmd.from !== 'controller') return; // ignora os próprios broadcasts
        handleControlRef.current(cmd);
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, [sessionCode]);

  // Transmite a fase, a prontidão e os selos coletados para o controle acompanhar.
  useEffect(() => {
    if (!sessionCode) return;
    fetch('/api/control/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: sessionCode, command: { from: 'display', type: 'state', screen, ready: phaseReady, badges: completedBadges } }),
    }).catch(() => {});
  }, [screen, sessionCode, phaseReady, completedBadges]);

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen isOnline={isOnline} controlUrl={controlUrl} controllerConnected={controllerConnected} />
        );
      case 'assistant':
        return <ConversationScreen onAdvance={() => advanceFrom('assistant')} isOnline={isOnline} />;
      case 'news':
        return <NewsAnalyzerScreen onNavigate={navigate} isOnline={isOnline} />;
      case 'quiz':
        return <QuizScreen onNavigate={navigate} controlCode={sessionCode} />;
      case 'checklist':
        return <ChecklistScreen onNavigate={navigate} />;
      case 'ai-errors':
        return <AIErrorsScreen onNavigate={navigate} />;
      case 'certificate':
        return <CertificateScreen onNavigate={navigate} onComplete={restartSession} controlCode={sessionCode} />;
      case 'admin':
        return <AdminScreen onNavigate={navigate} />;
      default:
        return (
          <HomeScreen isOnline={isOnline} controlUrl={controlUrl} controllerConnected={controllerConnected} />
        );
    }
  };

  return (
    <main
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 102, 255, 0.08) 0%, transparent 70%)' }}
      />

      {/* Status bar */}
      <StatusBar
        isOnline={isOnline}
        currentScreen={screen}
        onOpenSettings={() => setMenuOpen(true)}
      />

      {/* Screen content (com barra de progresso da jornada) */}
      <div className="w-full h-full pt-12 flex flex-col">
        {inJourney && <JourneyProgress current={screen} />}
        <div className="flex-1 min-h-0">{renderScreen()}</div>
      </div>

      {/* Celebração de selo entre fases */}
      <AnimatePresence>
        {celebration && <SealCelebration badge={celebration} />}
      </AnimatePresence>

      {/* Menu de configuração (pressionar o logo por 3 segundos) */}
      <SettingsMenu open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} />
    </main>
  );
}

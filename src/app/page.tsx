'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Screen } from '@/types';
import HomeScreen from '@/components/screens/HomeScreen';
import AssistantScreen from '@/components/screens/AssistantScreen';
import NewsAnalyzerScreen from '@/components/screens/NewsAnalyzerScreen';
import QuizScreen from '@/components/screens/QuizScreen';
import ChecklistScreen from '@/components/screens/ChecklistScreen';
import AIErrorsScreen from '@/components/screens/AIErrorsScreen';
import AdminScreen from '@/components/screens/AdminScreen';
import CertificateScreen from '@/components/screens/CertificateScreen';
import StatusBar from '@/components/ui/StatusBar';
import VoiceCommandOverlay from '@/components/ui/VoiceCommandOverlay';
import SettingsMenu from '@/components/ui/SettingsMenu';
import ScreenSaver from '@/components/ui/ScreenSaver';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import { GameProvider } from '@/context/GameProvider';
import { SettingsProvider, useSettings } from '@/context/SettingsProvider';

interface CommandFeedback {
  screen: Screen;
  text: string;
}

const WELCOME =
  'Olá! Eu sou o Detetive. Bem-vindo à nossa investigação sobre inteligência artificial e fake news. Toque numa opção para começar, ou fale comigo.';


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
  const {
    speak: speakWelcome,
    stop: stopWelcome,
  } = useElevenLabsSpeech();

  const [screen, setScreen] = useState<Screen>('home');
  const [isOnline, setIsOnline] = useState(true);
  const [commandFeedback, setCommandFeedback] = useState<CommandFeedback | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saverOpen, setSaverOpen] = useState(true);
  const [speechBusy, setSpeechBusy] = useState(false);

  const welcomePlayedRef = useRef(false);

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

  // ─── Boas-vindas (início de cada sessão) ─────────────────────────────────────
  const playWelcome = useCallback(() => {
    if (!sound || welcomePlayedRef.current) return;
    welcomePlayedRef.current = true;
    speakWelcome(WELCOME);
  }, [sound, speakWelcome]);

  // ─── Descanso de tela ────────────────────────────────────────────────────────
  const showScreenSaver = useCallback(() => {
    stopWelcome();
    welcomePlayedRef.current = false; // próxima sessão recebe boas-vindas
    setScreen('home'); // desmonta a escuta de telas internas antes do modo ocioso
    setSaverOpen(true);
  }, [stopWelcome]);

  const dismissScreenSaver = useCallback(() => {
    stopWelcome();
    setSaverOpen(false);
    setScreen('home');

    // A pessoa tocou na tela: o Detetive se apresenta com as boas-vindas.
    setTimeout(() => {
      if (sound && !welcomePlayedRef.current) playWelcome();
    }, 300);
  }, [playWelcome, sound, stopWelcome]);

  // Timer de inatividade (configurável; 0 = desligado)
  useEffect(() => {
    if (!idleSeconds || idleSeconds <= 0 || saverOpen || speechBusy) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const reset = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => showScreenSaver(), idleSeconds * 1000);
    };
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart', 'mousemove'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    // Mantém acordado durante atividades autônomas (ex.: o Detetive lendo o checklist)
    window.addEventListener('detetive:keepalive', reset);
    reset();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
      window.removeEventListener('detetive:keepalive', reset);
    };
  }, [idleSeconds, showScreenSaver, saverOpen, speechBusy]);

  // Esc volta ao início (navegação)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !speechBusy && !saverOpen) setScreen('home');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [speechBusy, saverOpen]);

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

  // Navega e interrompe as boas-vindas (a pessoa escolheu uma atividade)
  const navigate = useCallback((s: Screen) => {
    stopWelcome();
    setScreen(s);
  }, [stopWelcome]);

  const handleVoiceCommand = useCallback(
    (dest: Screen, recognizedText: string) => {
      if (speechBusy || saverOpen) return;
      setCommandFeedback({ screen: dest, text: recognizedText });
      setTimeout(() => {
        setCommandFeedback(null);
        stopWelcome();
        setScreen(dest);
      }, 1500);
    },
    [stopWelcome, speechBusy, saverOpen]
  );

  useVoiceCommands(handleVoiceCommand, screen !== 'assistant' && !saverOpen && !speechBusy);

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen onNavigate={navigate} isOnline={isOnline} />;
      case 'assistant':
        return <AssistantScreen onNavigate={navigate} onVoiceCommand={handleVoiceCommand} isOnline={isOnline} />;
      case 'news':
        return <NewsAnalyzerScreen onNavigate={navigate} isOnline={isOnline} />;
      case 'quiz':
        return <QuizScreen onNavigate={navigate} />;
      case 'checklist':
        return <ChecklistScreen onNavigate={navigate} />;
      case 'ai-errors':
        return <AIErrorsScreen onNavigate={navigate} />;
      case 'certificate':
        return <CertificateScreen onNavigate={navigate} onComplete={showScreenSaver} />;
      case 'admin':
        return <AdminScreen onNavigate={navigate} />;
      default:
        return <HomeScreen onNavigate={navigate} isOnline={isOnline} />;
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

      {/* Screen content */}
      <div className="w-full h-full pt-12">{renderScreen()}</div>

      {/* Overlay de transição ao reconhecer comando de voz */}
      <VoiceCommandOverlay feedback={commandFeedback} />

      {/* Menu de configuração (pressionar o logo por 3 segundos) */}
      <SettingsMenu open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} />

      {/* Descanso de tela (inatividade) */}
      <ScreenSaver
        open={saverOpen}
        onDismiss={dismissScreenSaver}
      />
    </main>
  );
}

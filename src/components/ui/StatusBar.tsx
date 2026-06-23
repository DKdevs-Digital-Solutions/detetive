'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Screen } from '@/types';

interface StatusBarProps {
  isOnline: boolean;
  currentScreen: Screen;
  onOpenSettings: () => void;
}

const SCREEN_LABELS: Record<Screen, string> = {
  home: 'Início',
  assistant: 'Assistente',
  news: 'Analisador de Notícias',
  quiz: 'Quiz Interativo',
  checklist: 'Checklist Anti-Fake News',
  'ai-errors': 'A IA Pode Errar?',
  certificate: 'Certificado',
  admin: 'Painel Admin',
};

export default function StatusBar({ isOnline, currentScreen, onOpenSettings }: StatusBarProps) {
  const [time, setTime] = useState('');
  const settingsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelSettingsHold = useCallback(() => {
    if (settingsTimerRef.current) {
      clearTimeout(settingsTimerRef.current);
      settingsTimerRef.current = null;
    }
  }, []);

  const startSettingsHold = useCallback(() => {
    cancelSettingsHold();
    settingsTimerRef.current = setTimeout(() => {
      settingsTimerRef.current = null;
      onOpenSettings();
    }, 3000);
  }, [cancelSettingsHold, onOpenSettings]);

  useEffect(() => () => cancelSettingsHold(), [cancelSettingsHold]);

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-4 z-50"
      style={{
        background: 'rgba(3, 7, 18, 0.96)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
      }}
    >
      {/* A logo também mantém o acesso oculto ao menu: segure por 3 segundos. */}
      <div
        className="flex items-center select-none cursor-default"
        onPointerDown={startSettingsHold}
        onPointerUp={cancelSettingsHold}
        onPointerLeave={cancelSettingsHold}
        onPointerCancel={cancelSettingsHold}
        onContextMenu={(event) => event.preventDefault()}
        aria-label="Logotipo do Colégio Monsenhor Raeder"
        style={{ touchAction: 'none' }}
      >
        <Image
          src="/logo-raeder-pb.png"
          alt="Colégio Monsenhor Raeder"
          width={142}
          height={42}
          priority
          draggable={false}
          className="h-[32px] w-auto object-contain"
        />
      </div>

      <span className="absolute left-1/2 -translate-x-1/2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {SCREEN_LABELS[currentScreen]}
      </span>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: isOnline ? '#00dd44' : '#ff3344',
              boxShadow: `0 0 6px ${isOnline ? '#00dd44' : '#ff3344'}`,
            }}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {time}
        </span>
      </div>
    </div>
  );
}

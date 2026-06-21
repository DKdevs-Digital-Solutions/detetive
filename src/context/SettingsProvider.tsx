'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';

interface Settings {
  gestures: boolean;   // câmera + reconhecimento de gestos
  libras: boolean;     // modo LIBRAS
  voice: boolean;      // microfone / escuta por voz
  sound: boolean;      // narração / voz do Detetive (TTS)
  idleSeconds: number; // tempo de inatividade até o descanso de tela (0 = desligado)
}

interface SettingsCtx extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const DEFAULTS: Settings = { gestures: true, libras: false, voice: true, sound: true, idleSeconds: 70 };
const STORAGE_KEY = 'detetive_settings_v1';

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const skipFirstPersist = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (skipFirstPersist.current) {
      skipFirstPersist.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  return <Ctx.Provider value={{ ...settings, set }}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSettings deve ser usado dentro de SettingsProvider');
  return c;
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useGame } from '@/context/GameProvider';
import { useSettings } from '@/context/SettingsProvider';

interface Props {
  onAdvance: () => void;
  isOnline: boolean;
}

type Phase = 'greeting' | 'listening' | 'thinking' | 'answering' | 'done';

const MAX_QUESTIONS = 3;
const IDLE_MS = 22_000; // sem pergunta por esse tempo → segue para o certificado

const GREETING =
  'Última missão, detetive! Agora é a sua vez de interrogar a inteligência artificial. Faça até três perguntas sobre IA ou fake news. Pode mandar a primeira.';
const CLOSING =
  'Caso encerrado, detetive! Foi uma honra investigar com você. Vou preparar o seu certificado.';
const TIMEOUT_LINE =
  'Sem mais perguntas, detetive? Então vamos direto ao seu certificado!';

export default function ConversationScreen({ onAdvance, isOnline }: Props) {
  const { grantBadge } = useGame();
  const { sound } = useSettings();
  const { speak, stop: stopSpeaking, isSpeaking, amplitude } = useElevenLabsSpeech();

  const [phase, setPhase] = useState<Phase>('greeting');
  const [questionCount, setQuestionCount] = useState(0);
  const [lastQuestion, setLastQuestion] = useState('');
  const [lastAnswer, setLastAnswer] = useState('');

  const finishedRef = useRef(false);
  const countRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const speakRef = useRef(speak);
  useEffect(() => { speakRef.current = speak; }, [speak]);
  // beginListening e handleQuestion se chamam mutuamente; o ref quebra o ciclo.
  const beginListeningRef = useRef<() => void>(() => {});

  const clearIdle = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  // Fala (ou só mostra texto, se a voz estiver desligada) e chama onDone ao terminar.
  const say = useCallback((text: string, onDone?: () => void) => {
    if (!sound) { onDone?.(); return; }
    speakRef.current(text, onDone);
  }, [sound]);

  // Encerra a fase e vai para o certificado (uma única vez).
  const finish = useCallback((spokenLine?: string) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearIdle();
    grantBadge('assistant'); // selo da última fase
    setPhase('done');
    const go = () => onAdvance();
    if (spokenLine && sound) say(spokenLine, go);
    else { stopSpeaking(); setTimeout(go, 400); }
  }, [clearIdle, grantBadge, onAdvance, say, sound, stopSpeaking]);

  // Recebe a pergunta falada → consulta a IA → fala a resposta.
  const handleQuestion = useCallback((raw: string) => {
    const question = raw.trim();
    if (finishedRef.current || !question || question.length < 2) return;
    clearIdle();

    countRef.current += 1;
    const n = countRef.current;
    setQuestionCount(n);
    setLastQuestion(question);
    setLastAnswer('');
    setPhase('thinking');
    historyRef.current = [...historyRef.current, { role: 'user' as const, content: question }].slice(-6);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question, history: historyRef.current.slice(0, -1) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (finishedRef.current) return;
        const content = data.content || 'Desculpe, não consegui responder agora.';
        setLastAnswer(content);
        historyRef.current = [...historyRef.current, { role: 'assistant' as const, content }].slice(-6);
        setPhase('answering');
        say(content, () => {
          if (finishedRef.current) return;
          if (n >= MAX_QUESTIONS) finish(CLOSING);
          else beginListeningRef.current();
        });
      })
      .catch(() => {
        if (finishedRef.current) return;
        const content = 'Tive um problema para responder. Pode tentar outra pergunta?';
        setLastAnswer(content);
        setPhase('answering');
        say(content, () => { if (!finishedRef.current) beginListeningRef.current(); });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearIdle, say, finish]);

  // Recognition de voz
  const { isSupported, interimText, startListening, stopListening } = useVoiceRecognition({
    onResult: handleQuestion,
    onInterimResult: () => clearIdle(), // pessoa começou a falar: cancela o tempo ocioso
  });

  // Começa a ouvir a próxima pergunta (ou encerra ao atingir o limite).
  const beginListening = useCallback(() => {
    if (finishedRef.current) return;
    if (countRef.current >= MAX_QUESTIONS) { finish(CLOSING); return; }
    setPhase('listening');
    // pequeno atraso garante que o TTS terminou e liberou o microfone
    setTimeout(() => {
      if (finishedRef.current) return;
      startListening();
      clearIdle();
      idleTimerRef.current = setTimeout(() => finish(TIMEOUT_LINE), IDLE_MS);
    }, 350);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearIdle, finish, startListening]);

  // Mantém o ref apontando para a versão mais recente de beginListening.
  useEffect(() => { beginListeningRef.current = beginListening; }, [beginListening]);

  // Avisa o controle remoto: libera "Continuar" (ir ao certificado) quando o
  // Detetive está ouvindo — não no meio da saudação/pensando/respondendo.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('detetive:phase-ready', { detail: { ready: phase === 'listening' } }));
  }, [phase]);

  // Saudação inicial → começa a ouvir
  useEffect(() => {
    grantBadge('assistant');
    const t = setTimeout(() => {
      say(GREETING, () => { if (!finishedRef.current) beginListening(); });
    }, 500);
    return () => {
      clearTimeout(t);
      clearIdle();
      finishedRef.current = true;
      stopListening();
      stopSpeaking();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabel: Record<Phase, string> = {
    greeting: 'O Detetive está se apresentando...',
    listening: 'Pode falar — estou ouvindo...',
    thinking: 'Pensando na resposta...',
    answering: 'O Detetive está respondendo...',
    done: 'Encerrando...',
  };

  const avatarStatus =
    phase === 'thinking' ? 'analyzing' : phase === 'listening' ? 'listening' : isSpeaking ? 'responding' : 'idle';

  return (
    <div className="w-full h-full flex flex-col items-center overflow-y-auto px-6 py-6 gap-5">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <Avatar status={avatarStatus} isSpeaking={isSpeaking} amplitude={amplitude} size={180} />

        {/* Contador de perguntas */}
        <div className="flex items-center gap-2">
          {Array.from({ length: MAX_QUESTIONS }).map((_, i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
              style={{ background: i < questionCount ? '#00dd66' : 'rgba(255,255,255,0.18)' }}
            />
          ))}
          <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
            Pergunta {Math.min(questionCount + (phase === 'listening' ? 1 : 0), MAX_QUESTIONS)} de {MAX_QUESTIONS}
          </span>
        </div>

        <p
          className="text-sm sm:text-base font-semibold text-center"
          style={{ color: phase === 'listening' ? '#00ff9d' : '#00d4ff' }}
        >
          {statusLabel[phase]}
        </p>
      </div>

      {/* Pergunta atual (texto reconhecido) */}
      {(lastQuestion || interimText) && (
        <div className="w-full max-w-xl flex justify-end shrink-0">
          <div
            className="px-4 py-2.5 rounded-2xl text-sm sm:text-base max-w-[85%]"
            style={{
              background: 'linear-gradient(135deg, rgba(0,100,255,0.3), rgba(0,50,150,0.3))',
              border: '1px solid rgba(0,100,255,0.4)',
              color: 'var(--text-primary)',
              borderBottomRightRadius: 4,
            }}
          >
            {interimText ? <span style={{ fontStyle: 'italic', opacity: 0.8 }}>{interimText}…</span> : lastQuestion}
          </div>
        </div>
      )}

      {/* Resposta do Detetive */}
      {lastAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl flex gap-3 shrink-0"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: 'rgba(0,100,200,0.3)', border: '1px solid #0066ff55', color: '#00d4ff' }}
          >
            D
          </div>
          <div
            className="px-4 py-3 rounded-2xl text-sm sm:text-base leading-relaxed"
            style={{ background: 'rgba(0,30,60,0.5)', border: '1px solid rgba(0,212,255,0.15)', color: 'var(--text-primary)', borderBottomLeftRadius: 4 }}
          >
            {lastAnswer}
          </div>
        </motion.div>
      )}

      {!isSupported && (
        <p className="text-xs sm:text-sm text-center max-w-md" style={{ color: '#ffaa00' }}>
          Este navegador não reconhece voz. Use o seu celular para continuar.
        </p>
      )}
      {!isOnline && (
        <p className="text-xs sm:text-sm text-center" style={{ color: '#ffaa00' }}>
          Sem internet — as respostas podem ficar limitadas.
        </p>
      )}

      {/* Ações */}
      <div className="mt-auto flex flex-col items-center gap-3 pt-2 shrink-0">
        {isSupported && phase !== 'thinking' && phase !== 'answering' && phase !== 'done' && (
          <button onClick={beginListening} className="btn btn-ghost text-sm sm:text-base" style={{ padding: '12px 22px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
            </svg>
            Falar {questionCount > 0 ? 'outra pergunta' : 'agora'}
          </button>
        )}
        <div className="flex items-center gap-2 text-sm sm:text-base font-semibold" style={{ color: '#00d4ff' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="currentColor" strokeWidth="2" />
            <path d="M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Continue pelo seu celular
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, Message, VoiceStatus } from '@/types';
import Avatar from '@/components/ui/Avatar';
import VoiceWave from '@/components/ui/VoiceWave';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import { useGame } from '@/context/GameProvider';
import { useSettings } from '@/context/SettingsProvider';

interface AssistantScreenProps {
  onNavigate: (screen: Screen) => void;
  onVoiceCommand: (screen: Screen, recognizedText: string) => void;
  isOnline: boolean;
}

const SUGGESTIONS = [
  'A IA pode errar?',
  'O que são fake news?',
  'Como verificar uma notícia?',
  'O que é LIBRAS?',
];

const HEART_WORDS = /obrigad|adorei|gostei|show|incrível|incr[íi]vel|parabéns|parabens|sensacional|amei|perfeito|maravilh|ótimo|otimo|love|fantástic|fantastico|demais|muito bom/i;
const LIKE_WORDS  = /legal|bacana|interessante|entendi|faz sentido|certo|correto|exato|confirm|concordo|sim sim/i;

const NAV_COMMANDS: Array<{ words: string[]; screen: Screen }> = [
  { words: ['voltar', 'menu', 'início', 'inicio', 'principal', 'casa'], screen: 'home' },
  { words: ['notícia', 'noticia', 'analisar', 'news'],                  screen: 'news' },
  { words: ['quiz', 'teste', 'jogo'],                                   screen: 'quiz' },
  { words: ['checklist', 'lista', 'verificação'],                       screen: 'checklist' },
  { words: ['erros', 'errar', 'falha'],                                 screen: 'ai-errors' },
];

export default function AssistantScreen({ onNavigate, onVoiceCommand, isOnline }: AssistantScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Olá! Sou o Detetive. Pode me fazer perguntas sobre inteligência artificial, fake news ou uso responsável da tecnologia. Você pode falar ou digitar.',
      timestamp: Date.now(),
    },
  ]);
  const [input,         setInput]         = useState('');
  const [voiceStatus,   setVoiceStatus]   = useState<VoiceStatus>('idle');
  const [isLoading,     setIsLoading]     = useState(false);
  const [avatarReaction, setAvatarReaction] = useState<'heart' | 'like' | null>(null);
  const [reactionKey,   setReactionKey]   = useState(0);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLTextAreaElement>(null);
  const autoListenRef   = useRef(true);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetedRef      = useRef(false);

  const { speak, isSpeaking, amplitude } = useElevenLabsSpeech();
  const { grantBadge } = useGame();
  const { voice: voiceEnabled, sound: soundEnabled } = useSettings();

  // Fala apenas se a voz do Detetive estiver ativada nas configurações
  const speakIfEnabled = useCallback(
    (text: string, onEnd?: () => void) => {
      if (soundEnabled) speak(text, onEnd);
      else onEnd?.();
    },
    [soundEnabled, speak]
  );

  // ─── Reação no avatar ───────────────────────────────────────────────────────
  const triggerReaction = useCallback((type: 'heart' | 'like') => {
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    setAvatarReaction(type);
    setReactionKey((k) => k + 1);
    reactionTimerRef.current = setTimeout(() => setAvatarReaction(null), 2500);
  }, []);

  // ─── Voz ───────────────────────────────────────────────────────────────────
  const { isListening, isSupported, interimText, startListening, stopListening } =
    useVoiceRecognition({
      onResult: (text) => {
        // Ignora qualquer ordem capturada durante análise ou resposta.
        if (isSpeaking || isLoading || voiceStatus === 'responding' || voiceStatus === 'analyzing') return;

        const lower = text.toLowerCase().trim();

        for (const { words, screen } of NAV_COMMANDS) {
          if (words.some((w) => lower.includes(w))) {
            autoListenRef.current = false;
            stopListening();
            onVoiceCommand(screen, lower.slice(0, 24));
            return;
          }
        }

        if (HEART_WORDS.test(lower)) triggerReaction('heart');
        else if (LIKE_WORDS.test(lower)) triggerReaction('like');

        setVoiceStatus('analyzing');
        handleSend(text);
      },
      onInterimResult: () => setVoiceStatus('listening'),
    });

  // ─── Enviar mensagem ────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      if (HEART_WORDS.test(text)) triggerReaction('heart');
      else if (LIKE_WORDS.test(text)) triggerReaction('like');

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);
      setVoiceStatus('analyzing');
      grantBadge('assistant'); // selo da jornada

      // Para a escuta enquanto o bot responde (evita captar a própria fala).
      stopListening();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text.trim(), history: messages.slice(-6) }),
        });

        const data = await res.json();
        const content = data.content || 'Desculpe, não consegui processar sua pergunta.';

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setVoiceStatus('responding');

        speakIfEnabled(content, () => {
          setVoiceStatus('idle');
          if (autoListenRef.current) {
            setTimeout(() => {
              if (autoListenRef.current) {
                startListening();
                setVoiceStatus('listening');
              }
            }, 600);
          }
        });
      } catch {
        const errMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Ocorreu um erro. Tente novamente.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setVoiceStatus('idle');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, speakIfEnabled, stopListening, startListening, triggerReaction, grantBadge]
  );

  // Ao entrar: o Detetive lê a saudação e só então começa a ouvir
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const greeting = messages[0]?.content || '';
    const beginListening = () => {
      if (voiceEnabled && isSupported && autoListenRef.current) {
        startListening();
        setVoiceStatus('listening');
      }
    };
    const t = setTimeout(() => {
      if (soundEnabled && greeting) {
        setVoiceStatus('responding');
        speak(greeting, () => { setVoiceStatus('idle'); beginListening(); });
      } else {
        beginListening();
      }
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Liga/desliga a escuta quando a configuração de voz muda em tempo real
  useEffect(() => {
    if (!voiceEnabled) {
      autoListenRef.current = false;
      stopListening();
      setVoiceStatus('idle');
    } else {
      autoListenRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled]);

  // Reinicia escuta quando para sozinha.
  // NÃO reinicia durante 'analyzing' ou 'responding' para não conflitar com
  // a recognition de interrupção ou com o processamento da API.
  useEffect(() => {
    if (
      voiceEnabled &&
      !isListening &&
      !isLoading &&
      !isSpeaking &&
      voiceStatus !== 'responding' &&
      voiceStatus !== 'analyzing' &&
      autoListenRef.current &&
      isSupported
    ) {
      const t = setTimeout(() => {
        if (
          autoListenRef.current &&
          !isLoading &&
          !isSpeaking
        ) {
          startListening();
          setVoiceStatus('listening');
        }
      }, 800);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, isLoading, isSpeaking, voiceStatus, isSupported, voiceEnabled]);

  const handleVoiceToggle = () => {
    if (isListening) {
      autoListenRef.current = false;
      stopListening();
      setVoiceStatus('idle');
    } else {
      autoListenRef.current = true;
      setVoiceStatus('listening');
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    };
  }, []);

  const statusLabel: Record<VoiceStatus, string> = {
    idle: 'Pronto', listening: 'Ouvindo...', analyzing: 'Analisando...', responding: 'Respondendo...',
  };

  return (
    <div className="w-full h-full flex overflow-hidden portrait:flex-col">
      {/* Painel esquerdo */}
      <div
        className="flex flex-col items-center gap-3 px-4 py-4 shrink-0 overflow-y-auto w-[260px] portrait:w-full portrait:max-h-[42vh]"
        style={{ borderRight: '1px solid rgba(0,212,255,0.1)', background: 'rgba(0,10,25,0.3)' }}
      >
        <Avatar
          status={voiceStatus}
          isSpeaking={isSpeaking}
          amplitude={amplitude}
          reaction={avatarReaction}
          reactionKey={reactionKey}
          size={160}
        />

        <motion.div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
          style={{
            background: 'rgba(0,50,80,0.4)',
            border: '1px solid rgba(0,212,255,0.25)',
            color:
              voiceStatus === 'responding' ? '#00dd44' :
              voiceStatus === 'analyzing'  ? '#ffaa00' : '#00d4ff',
          }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                voiceStatus === 'responding' ? '#00dd44' :
                voiceStatus === 'analyzing'  ? '#ffaa00' :
                voiceStatus === 'listening'  ? '#ff5500' : '#00d4ff',
            }}
          />
          {statusLabel[voiceStatus]}
        </motion.div>

        <VoiceWave status={voiceStatus} />

        {voiceEnabled && isSupported && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleVoiceToggle}
            className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{
              background: isListening
                ? 'linear-gradient(135deg, #ff3344, #cc0022)'
                : 'linear-gradient(135deg, #00d4ff, #0066ff)',
              color: 'white',
              boxShadow: isListening
                ? '0 0 20px rgba(255,51,68,0.4)'
                : '0 0 20px rgba(0,212,255,0.3)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              {isListening ? (
                <rect x="6" y="6" width="12" height="12" rx="2" />
              ) : (
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
              )}
            </svg>
            {isListening ? 'Parar microfone' : 'Ativar microfone'}
          </motion.button>
        )}


        <button
          onClick={() => onNavigate('home')}
          className="btn btn-ghost w-full mt-auto text-xs"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Voltar ao Menu
        </button>
      </div>

      {/* Painel direito: Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
              >
                {msg.role === 'assistant' && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: 'rgba(0,100,200,0.3)', border: '1px solid #0066ff55', color: '#00d4ff' }}
                  >
                    D
                  </div>
                )}
                <div
                  className="max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? {
                          background: 'linear-gradient(135deg, rgba(0,100,255,0.3), rgba(0,50,150,0.3))',
                          border: '1px solid rgba(0,100,255,0.4)',
                          color: 'var(--text-primary)',
                          borderBottomRightRadius: 4,
                        }
                      : {
                          background: 'rgba(0,30,60,0.5)',
                          border: '1px solid rgba(0,212,255,0.15)',
                          color: 'var(--text-primary)',
                          borderBottomLeftRadius: 4,
                        }
                  }
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(0,100,200,0.3)', border: '1px solid #0066ff55', color: '#00d4ff' }}
              >
                D
              </div>
              <div
                className="flex gap-1 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(0,30,60,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i} className="w-2 h-2 rounded-full" style={{ background: '#00d4ff' }}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {interimText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
              <div
                className="px-4 py-2 rounded-xl text-sm italic"
                style={{ color: 'var(--text-muted)', border: '1px dashed rgba(0,212,255,0.2)' }}
              >
                {interimText}...
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: 'rgba(0,50,100,0.3)',
                  border: '1px solid rgba(0,212,255,0.2)',
                  color: 'var(--text-secondary)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div
          className="p-4 flex gap-3 items-end"
          style={{ borderTop: '1px solid rgba(0,212,255,0.1)', background: 'rgba(3,7,18,0.5)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta... (Enter para enviar)"
            rows={2}
            className="flex-1"
            style={{ maxHeight: 100, overflowY: 'auto' }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="btn btn-primary shrink-0"
            style={{ padding: '12px 20px', opacity: !input.trim() || isLoading ? 0.5 : 1 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

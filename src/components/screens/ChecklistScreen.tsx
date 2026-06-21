'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Screen } from '@/types';
import { useGame } from '@/context/GameProvider';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import Avatar from '@/components/ui/Avatar';

interface ChecklistScreenProps {
  onNavigate: (screen: Screen) => void;
}

const CHECKLIST_ITEMS = [
  { id: 1, question: 'Quem publicou essa informação?', detail: 'A fonte é um veículo conhecido, instituto de pesquisa ou órgão oficial?' },
  { id: 2, question: 'Existe uma fonte confiável citada?', detail: 'A notícia cita a origem dos dados? Dá para verificar?' },
  { id: 3, question: 'A notícia tem data de publicação?', detail: 'Notícias antigas podem ser recompartilhadas fora de contexto.' },
  { id: 4, question: 'O autor é identificado?', detail: 'Há um jornalista ou especialista responsável pelo conteúdo?' },
  { id: 5, question: 'O título parece exagerado?', detail: 'Títulos como CHOQUE, INCRÍVEL ou SEGREDO REVELADO são sinais de alerta.' },
  { id: 6, question: 'A informação aparece em outros sites confiáveis?', detail: 'Pesquise a notícia em pelo menos três fontes diferentes e conhecidas.' },
  { id: 7, question: 'A imagem pode estar fora de contexto?', detail: 'Fotos de eventos antigos são frequentemente usadas em notícias falsas.' },
  { id: 8, question: 'A notícia tenta causar medo, raiva ou urgência?', detail: 'Emoções fortes são usadas para impedir o pensamento crítico.' },
  { id: 9, question: 'A informação apresenta dados ou apenas opinião?', detail: 'Dados verificáveis tornam a informação mais confiável.' },
  { id: 10, question: 'A IA explicou de onde veio a resposta?', detail: 'IAs devem indicar a origem de suas informações. Se não o fizer, desconfie.' },
];

const INTRO = 'Vou te ensinar a desconfiar de notícias falsas. Preste atenção em cada ponto que eu vou marcar.';
const CLOSING = 'Pronto! Quanto mais respostas sim, mais confiável é a notícia. Na dúvida, não compartilhe.';

export default function ChecklistScreen({ onNavigate }: ChecklistScreenProps) {
  const { grantBadge } = useGame();
  const { speak, stop: stopSpeaking, isSpeaking, amplitude } = useElevenLabsSpeech();

  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const playingRef = useRef(false);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const didStartRef = useRef(false);

  // Selo da jornada: concedido ao avaliar metade ou mais dos critérios
  useEffect(() => {
    if (checked.size >= 5) grantBadge('checklist');
  }, [checked, grantBadge]);

  // ─── Narração automática ────────────────────────────────────────────────────
  const playFrom = (i: number) => {
    if (!playingRef.current) return;

    if (i >= CHECKLIST_ITEMS.length) {
      setCurrentIndex(-1);
      speak(CLOSING, () => { playingRef.current = false; setPlaying(false); });
      return;
    }

    const item = CHECKLIST_ITEMS[i];
    setCurrentIndex(i);
    setChecked((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
    itemRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    speak(`${item.question} ${item.detail}`, () => {
      if (playingRef.current) setTimeout(() => playFrom(i + 1), 300);
    });
  };

  const startNarration = () => {
    playingRef.current = true;
    setPlaying(true);
    setChecked(new Set());
    setCurrentIndex(-1);
    stopSpeaking();
    speak(INTRO, () => { if (playingRef.current) playFrom(0); });
  };

  const stopNarration = () => {
    playingRef.current = false;
    setPlaying(false);
    setCurrentIndex(-1);
    stopSpeaking();
  };

  // Inicia sozinho ao abrir a tela
  useEffect(() => {
    if (didStartRef.current) return;
    didStartRef.current = true;
    const t = setTimeout(() => startNarration(), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Para a fala ao sair da tela
  useEffect(() => {
    return () => { playingRef.current = false; stopSpeaking(); };
  }, [stopSpeaking]);

  const toggle = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const count = checked.size;
  const pct = Math.round((count / CHECKLIST_ITEMS.length) * 100);
  const verdict =
    count >= 8
      ? { text: 'Informação parece confiável!', color: '#00dd44' }
      : count >= 5
      ? { text: 'Verifique mais antes de compartilhar.', color: '#ffaa00' }
      : { text: 'Muitos sinais suspeitos. Não compartilhe!', color: '#ff3344' };

  const reset = () => { stopNarration(); setChecked(new Set()); };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <button onClick={() => onNavigate('home')} className="btn btn-ghost py-2 px-3 text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Checklist Anti-Fake News</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>O Detetive marca cada ponto enquanto explica</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${verdict.color}88, ${verdict.color})` }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-sm font-mono font-bold" style={{ color: verdict.color, minWidth: 32 }}>
            {count}/10
          </span>
        </div>
      </div>

      {/* Barra do narrador */}
      <div
        className="px-6 py-2.5 flex items-center gap-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,15,30,0.45)' }}
      >
        <Avatar status={isSpeaking ? 'responding' : 'idle'} isSpeaking={isSpeaking} amplitude={amplitude} size={60} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: isSpeaking ? '#00ff9d' : '#00d4ff' }}>
            {playing ? 'O Detetive está explicando...' : 'Explicação concluída'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {currentIndex >= 0
              ? `Critério ${currentIndex + 1} de 10`
              : playing
              ? 'Preparando...'
              : 'O Detetive marcou cada ponto de verificação'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {CHECKLIST_ITEMS.map((item, i) => {
            const isChecked = checked.has(item.id);
            const isCurrent = currentIndex === i;
            return (
              <motion.button
                key={item.id}
                ref={(el) => { itemRefs.current[i] = el; }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0, scale: isCurrent ? 1.02 : 1 }}
                transition={{ delay: playing ? 0 : i * 0.04 }}
                onClick={() => toggle(item.id)}
                className="w-full p-3 rounded-xl text-left flex items-start gap-3 transition-all duration-200"
                style={{
                  background: isCurrent ? 'rgba(0,212,255,0.12)' : isChecked ? 'rgba(0,221,68,0.1)' : 'rgba(0,20,40,0.3)',
                  border: `1px solid ${isCurrent ? '#00d4ff' : isChecked ? 'rgba(0,221,68,0.4)' : 'rgba(0,212,255,0.12)'}`,
                  boxShadow: isCurrent ? '0 0 16px rgba(0,212,255,0.35)' : 'none',
                }}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: isChecked ? '#00dd44' : 'rgba(0,212,255,0.1)',
                    border: `1px solid ${isChecked ? '#00dd44' : 'rgba(0,212,255,0.3)'}`,
                  }}
                >
                  {isChecked && (
                    <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: isChecked ? '#00dd44' : 'var(--text-primary)' }}>
                    {item.id}. {item.question}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.detail}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer verdict */}
      <div
        className="px-6 py-3 flex items-center justify-between shrink-0"
        style={{ borderTop: '1px solid rgba(0,212,255,0.1)', background: 'rgba(3,7,18,0.6)' }}
      >
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Veredicto ({count} de 10 critérios):</p>
          <motion.p
            className="text-sm font-bold"
            style={{ color: verdict.color }}
            animate={{ opacity: [0.8, 1] }}
            key={verdict.text}
          >
            {verdict.text}
          </motion.p>
        </div>
        <button onClick={reset} className="btn btn-ghost text-xs py-2 px-4">
          Reiniciar
        </button>
      </div>
    </div>
  );
}

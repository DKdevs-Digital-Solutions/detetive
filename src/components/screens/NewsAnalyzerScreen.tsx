'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, AnalysisResult } from '@/types';
import TrafficLight from '@/components/ui/TrafficLight';
import Avatar from '@/components/ui/Avatar';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useElevenLabsSpeech } from '@/hooks/useElevenLabsSpeech';
import { useGame } from '@/context/GameProvider';

interface NewsAnalyzerScreenProps {
  onNavigate: (screen: Screen) => void;
  onAdvance: () => void;
  isOnline: boolean;
}

const EXAMPLES = [
  'Estudo secreto descobriu que dormir duas horas por dia melhora a saúde.',
  'A Terra é plana, e os governos escondem essa verdade há décadas.',
  'Pesquisadores da USP publicaram estudo em 2024 sobre impactos do estresse na memória.',
];

export default function NewsAnalyzerScreen({ onNavigate, onAdvance, isOnline }: NewsAnalyzerScreenProps) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { speak, isSpeaking, amplitude } = useElevenLabsSpeech();
  const { grantBadge } = useGame();
  const didDemoRef = useRef(false);

  const analyze = useCallback(async (inputText: string) => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      grantBadge('news'); // selo da jornada

      const speechText = `Resultado: ${data.riskLabel}. ${data.explanation} ${data.recommendation}`;
      speak(speechText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [speak, grantBadge]);

  const { isListening: voiceListening, isSupported, interimText, startListening, stopListening } =
    useVoiceRecognition({
      onResult: (t) => {
        setText(t);
        setIsListening(false);
        analyze(t);
      },
      onInterimResult: (t) => setText(t),
    });

  // O Detetive conduz: explica o semáforo e demonstra com um exemplo,
  // depois libera para o visitante experimentar.
  useEffect(() => {
    if (didDemoRef.current) return;
    didDemoRef.current = true;
    const t = setTimeout(() => {
      speak(
        'Vou te mostrar como analisar uma notícia. Eu uso um semáforo da confiança: verde é confiável, amarelo pede atenção e vermelho é suspeito. Veja este exemplo.',
        () => { setText(EXAMPLES[0]); analyze(EXAMPLES[0]); }
      );
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVoice = () => {
    if (voiceListening) {
      stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      startListening();
    }
  };

  const levelBg: Record<string, string> = {
    green: 'rgba(0,221,68,0.08)',
    yellow: 'rgba(255,170,0,0.08)',
    red: 'rgba(255,51,68,0.08)',
  };

  const levelBorder: Record<string, string> = {
    green: 'rgba(0,221,68,0.3)',
    yellow: 'rgba(255,170,0,0.3)',
    red: 'rgba(255,51,68,0.3)',
  };

  const levelColor: Record<string, string> = {
    green: '#00dd44',
    yellow: '#ffaa00',
    red: '#ff3344',
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-6 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}
      >
        <button onClick={() => onNavigate('home')} className="btn btn-ghost py-2 px-3 text-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,100,255,0.2)', border: '1px solid rgba(0,100,255,0.3)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#00d4ff" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Analisador de Notícias</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Digite ou fale uma notícia para analisar</p>
          </div>
        </div>

        {!isOnline && (
          <div className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', color: '#ffaa00' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Offline — análise básica
          </div>
        )}
      </div>

      {/* Barra do narrador */}
      <div
        className="px-6 py-2.5 flex items-center gap-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,15,30,0.45)' }}
      >
        <Avatar status={isSpeaking ? 'responding' : isAnalyzing ? 'analyzing' : 'idle'} isSpeaking={isSpeaking} amplitude={amplitude} size={56} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: isSpeaking ? '#00ff9d' : '#00d4ff' }}>
            {isSpeaking ? 'O Detetive está explicando...' : isAnalyzing ? 'Analisando...' : 'Veja o exemplo e depois experimente'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Verde = confiável · Amarelo = atenção · Vermelho = suspeito</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Input area */}
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          🔎 Agora é a sua vez — escolha ou digite uma notícia para analisar:
        </p>
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole ou digite a notícia, frase ou informação que deseja analisar..."
            rows={4}
            className="w-full"
            style={{ minHeight: 100 }}
          />

          {/* Examples */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Exemplos para testar:</p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setText(ex)}
                  className="text-left text-xs px-3 py-2 rounded-lg transition-all truncate"
                  style={{
                    background: 'rgba(0,40,80,0.3)',
                    border: '1px solid rgba(0,212,255,0.15)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  &quot;{ex}&quot;
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => analyze(text)}
              disabled={!text.trim() || isAnalyzing}
              className="flex-1 btn btn-primary"
              style={{ opacity: !text.trim() || isAnalyzing ? 0.6 : 1 }}
            >
              {isAnalyzing ? (
                <>
                  <motion.div
                    className="w-4 h-4 rounded-full border-2"
                    style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Analisando...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Analisar Notícia
                </>
              )}
            </motion.button>

            {isSupported && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleVoice}
                className="btn"
                style={{
                  background: voiceListening
                    ? 'linear-gradient(135deg, #ff3344, #cc0022)'
                    : 'rgba(0,50,100,0.4)',
                  border: `1px solid ${voiceListening ? '#ff3344' : 'rgba(0,212,255,0.3)'}`,
                  color: 'white',
                  padding: '12px 16px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={voiceListening ? 'white' : 'none'}>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" stroke="white" strokeWidth="2" />
                </svg>
              </motion.button>
            )}

            {text && (
              <button onClick={() => { setText(''); setResult(null); }} className="btn btn-ghost" style={{ padding: '12px 16px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: levelBg[result.level],
                border: `1px solid ${levelBorder[result.level]}`,
              }}
            >
              {/* Result header */}
              <div
                className="flex items-center gap-4 p-4"
                style={{ borderBottom: `1px solid ${levelBorder[result.level]}` }}
              >
                <TrafficLight level={result.level} size="md" />
                <div className="flex-1">
                  <div className="text-xs font-bold tracking-widest mb-1" style={{ color: levelColor[result.level] }}>
                    {result.riskLabel}
                  </div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {result.title}
                  </h3>
                </div>
              </div>

              {/* Explanation */}
              <div className="p-4 space-y-4">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {result.explanation}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {result.suspiciousPoints.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#ff3344' }}>Pontos suspeitos:</p>
                      <ul className="space-y-1">
                        {result.suspiciousPoints.map((p, i) => (
                          <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: '#ff3344' }}>•</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.positivePoints.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#00dd44' }}>Pontos positivos:</p>
                      <ul className="space-y-1">
                        {result.positivePoints.map((p, i) => (
                          <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: '#00dd44' }}>•</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl" style={{ background: 'rgba(0,20,40,0.5)', border: '1px solid rgba(0,212,255,0.15)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#00d4ff' }}>Recomendação:</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{result.recommendation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avançar na jornada */}
      <div
        className="px-6 py-3 flex justify-end shrink-0"
        style={{ borderTop: '1px solid rgba(0,212,255,0.1)', background: 'rgba(3,7,18,0.6)' }}
      >
        <button onClick={onAdvance} className="btn btn-primary text-sm" style={{ padding: '12px 26px' }}>
          Continuar
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

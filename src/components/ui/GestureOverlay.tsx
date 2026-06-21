'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GestureType } from '@/types';
import { LibrasResult, LIBRAS_GUIDE } from '@/lib/libras';

interface GestureOverlayProps {
  gesture: GestureType;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  status: 'inactive' | 'loading' | 'active' | 'error';
  librasMode?: boolean;
  librasSign?: LibrasResult;
}

const GESTURE_LABELS: Record<NonNullable<GestureType>, string> = {
  open_hand:   'Pausar fala',
  thumbs_up:   'Confiável',
  thumbs_down: 'Suspeito',
  pointing_up: 'Mais detalhes',
  circular:    'Repetir',
  two_hands:   'Menu principal',
};

// Ícones SVG para gestos (sem emoji)
const GestureIcon = ({ gesture }: { gesture: NonNullable<GestureType> }) => {
  if (gesture === 'open_hand') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v1M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8M6 14a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2c0 3.314 2.686 6 6 6a6 6 0 0 0 6-6v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  if (gesture === 'thumbs_up' || gesture === 'thumbs_down') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: gesture === 'thumbs_down' ? 'scaleY(-1)' : undefined }}>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (gesture === 'pointing_up') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (gesture === 'circular') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v1M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default function GestureOverlay({
  gesture,
  videoRef,
  canvasRef,
  status,
  librasMode = false,
  librasSign,
}: GestureOverlayProps) {
  const frameColor = librasMode ? '#b388ff' : '#00d4ff';

  return (
    <div className="flex flex-col gap-2">
      {/* Feed de câmera */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          width: 160,
          height: 120,
          border: `1px solid ${frameColor}44`,
        }}
      >
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(3,7,18,0.95)' }}>
            <motion.div
              className="w-6 h-6 rounded-full border-2"
              style={{ borderColor: frameColor, borderTopColor: 'transparent' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-xs" style={{ color: frameColor }}>Carregando câmera...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ background: 'rgba(3,7,18,0.95)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01" stroke="#ff3344" strokeWidth="2" strokeLinecap="round" />
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#ff3344" strokeWidth="2" />
            </svg>
            <span className="text-xs" style={{ color: '#ff3344' }}>Câmera indisponível</span>
          </div>
        )}

        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: status === 'active' ? 'block' : 'none', transform: 'scaleX(-1)' }}
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          width={160}
          height={120}
          className="absolute inset-0 w-full h-full"
          style={{ display: status === 'active' ? 'block' : 'none' }}
        />

        {/* Cantos de foco */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
          <div
            key={pos}
            className="absolute w-4 h-4"
            style={{
              top:    pos.startsWith('t') ? 4 : undefined,
              bottom: pos.startsWith('b') ? 4 : undefined,
              left:   pos.endsWith('l')   ? 4 : undefined,
              right:  pos.endsWith('r')   ? 4 : undefined,
              borderTop:    pos.startsWith('t') ? `2px solid ${frameColor}` : undefined,
              borderBottom: pos.startsWith('b') ? `2px solid ${frameColor}` : undefined,
              borderLeft:   pos.endsWith('l')   ? `2px solid ${frameColor}` : undefined,
              borderRight:  pos.endsWith('r')   ? `2px solid ${frameColor}` : undefined,
            }}
          />
        ))}

        {/* Badge de modo */}
        {status === 'active' && (
          <div
            className="absolute top-1 left-1 text-xs px-1.5 py-0.5 rounded font-bold"
            style={{
              background: librasMode ? 'rgba(179,136,255,0.2)' : 'rgba(0,212,255,0.15)',
              color: frameColor,
              fontSize: 9,
            }}
          >
            {librasMode ? 'LIBRAS' : 'GESTO'}
          </div>
        )}
      </div>

      {/* LIBRAS: exibe letra detectada */}
      {librasMode && status === 'active' && (
        <div className="flex flex-col gap-1">
          <AnimatePresence mode="wait">
            {librasSign?.letter ? (
              <motion.div
                key={librasSign.letter}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="flex flex-col items-center rounded-xl py-2"
                style={{
                  background: 'rgba(179,136,255,0.1)',
                  border: '1px solid rgba(179,136,255,0.4)',
                }}
              >
                <span
                  className="font-black leading-none"
                  style={{ color: '#b388ff', fontSize: 42, textShadow: '0 0 20px #b388ff88' }}
                >
                  {librasSign.letter}
                </span>
                <span className="text-xs mt-0.5" style={{ color: '#b388ff99' }}>
                  {librasSign.description}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center rounded-xl py-2"
                style={{
                  background: 'rgba(30,20,60,0.3)',
                  border: '1px solid rgba(179,136,255,0.15)',
                }}
              >
                <span className="text-xs" style={{ color: 'rgba(179,136,255,0.5)' }}>
                  Mostre um sinal...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Guia compacto (rolável — alfabeto ampliado) */}
          <div className="grid grid-cols-3 gap-0.5 overflow-y-auto" style={{ maxHeight: 134 }}>
            {LIBRAS_GUIDE.map(({ letter, hint }) => (
              <div
                key={letter}
                className="flex flex-col items-center py-1 rounded"
                style={{
                  background: librasSign?.letter === letter
                    ? 'rgba(179,136,255,0.2)'
                    : 'rgba(179,136,255,0.05)',
                  border: librasSign?.letter === letter
                    ? '1px solid rgba(179,136,255,0.5)'
                    : '1px solid transparent',
                }}
              >
                <span className="font-bold text-sm" style={{ color: '#b388ff' }}>{letter}</span>
                <span style={{ color: 'rgba(179,136,255,0.5)', fontSize: 8, textAlign: 'center', lineHeight: 1.1 }}>{hint}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gestos: badge do gesto detectado */}
      {!librasMode && (
        <AnimatePresence>
          {gesture && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-center"
            >
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: 'rgba(0,212,255,0.15)',
                  border: '1px solid #00d4ff55',
                  color: '#00d4ff',
                }}
              >
                <GestureIcon gesture={gesture} />
                <span>{GESTURE_LABELS[gesture]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Guia de gestos */}
      {!librasMode && status === 'active' && (
        <div className="text-xs space-y-0.5" style={{ color: 'rgba(0,212,255,0.45)', fontSize: 10 }}>
          <div>Abrir mao — pausar</div>
          <div>Polegar cima/baixo — avaliar</div>
          <div>Circulos — repetir</div>
          <div>Duas maos — menu</div>
        </div>
      )}
    </div>
  );
}

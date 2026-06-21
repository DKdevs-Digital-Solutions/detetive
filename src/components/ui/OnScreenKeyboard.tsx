'use client';

import { motion } from 'framer-motion';

interface Props {
  mode: 'text' | 'numeric';
  onKey: (char: string) => void;
  onBackspace: () => void;
  onEnter?: () => void;
  enterLabel?: string;
  enterDisabled?: boolean;
}

const TEXT_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Á', 'É', 'Ã'],
];
const NUM_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['0'],
];

function Key({ label, onClick, flex = 1, accent = false }: { label: string; onClick: () => void; flex?: number; accent?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="rounded-xl font-semibold select-none"
      style={{
        flex,
        minWidth: 0,
        height: 52,
        fontSize: 18,
        background: accent ? 'linear-gradient(135deg, #00d4ff, #0066ff)' : 'rgba(0,40,75,0.55)',
        border: `1px solid ${accent ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.2)'}`,
        color: accent ? '#fff' : 'var(--text-primary)',
      }}
    >
      {label}
    </motion.button>
  );
}

export default function OnScreenKeyboard({ mode, onKey, onBackspace, onEnter, enterLabel = 'Confirmar', enterDisabled }: Props) {
  const rows = mode === 'text' ? TEXT_ROWS : NUM_ROWS;

  return (
    <div className="w-full flex flex-col gap-2" style={{ maxWidth: mode === 'text' ? 620 : 280 }}>
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 justify-center">
          {row.map((k) => (
            <Key key={k} label={k} onClick={() => onKey(k)} />
          ))}
        </div>
      ))}

      <div className="flex gap-2 justify-center mt-1">
        {mode === 'text' && <Key label="Espaço" onClick={() => onKey(' ')} flex={3} />}
        <Key label="⌫ Apagar" onClick={onBackspace} flex={2} />
        {onEnter && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={enterDisabled ? undefined : onEnter}
            className="rounded-xl font-bold"
            style={{
              flex: 2,
              height: 52,
              fontSize: 16,
              background: enterDisabled ? 'rgba(0,60,90,0.3)' : 'linear-gradient(135deg, #00dd66, #00aa44)',
              border: '1px solid rgba(0,221,102,0.5)',
              color: '#fff',
              opacity: enterDisabled ? 0.5 : 1,
            }}
          >
            {enterLabel}
          </motion.button>
        )}
      </div>
    </div>
  );
}

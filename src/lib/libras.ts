// Classificador de LIBRAS (datilologia / alfabeto manual) — uma mão, landmarks MediaPipe.
// Usa geometria robusta a rotação (distâncias ao pulso), não apenas altura (y).

interface Lm { x: number; y: number; z: number; }

// Histórico das pontas (indicador + mindinho) para letras com movimento (J, Z)
export interface MotionPoint { ix: number; iy: number; px: number; py: number; }

export interface LibrasResult {
  letter: string | null;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

// Landmarks: WRIST=0 | THUMB 1-4 | INDEX 5-8 | MIDDLE 9-12 | RING 13-16 | PINKY 17-20
const F = {
  index:  { tip: 8,  pip: 6,  mcp: 5 },
  middle: { tip: 12, pip: 10, mcp: 9 },
  ring:   { tip: 16, pip: 14, mcp: 13 },
  pinky:  { tip: 20, pip: 18, mcp: 17 },
};

function d(a: Lm, b: Lm): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

type FState = 'ext' | 'bent' | 'curl';
// Estado do dedo por distância ao pulso (rotação-invariante):
// estendido = ponta bem mais longe que a junção; dobrado = ponta volta para a palma.
function fingerState(lms: Lm[], f: { tip: number; pip: number; mcp: number }, wrist: Lm, scale: number): FState {
  const dTip = d(lms[f.tip], wrist);
  const dPip = d(lms[f.pip], wrist);
  const dMcp = d(lms[f.mcp], wrist);
  if (dTip > dPip + 0.06 * scale) return 'ext';
  if (dTip < dMcp + 0.06 * scale) return 'curl';
  return 'bent';
}

export function classifyLibras(lms: Lm[], history?: MotionPoint[]): LibrasResult {
  if (!lms || lms.length < 21) return { letter: null, description: '', confidence: 'low' };

  const wrist = lms[0];
  const scale = d(wrist, lms[9]) || 0.2; // tamanho da palma (normalização)

  const sI = fingerState(lms, F.index, wrist, scale);
  const sM = fingerState(lms, F.middle, wrist, scale);
  const sR = fingerState(lms, F.ring, wrist, scale);
  const sP = fingerState(lms, F.pinky, wrist, scale);

  const eI = sI === 'ext', eM = sM === 'ext', eR = sR === 'ext', eP = sP === 'ext';
  const cI = sI === 'curl', cM = sM === 'curl', cR = sR === 'curl', cP = sP === 'curl';
  const extCount = [eI, eM, eR, eP].filter(Boolean).length;

  const thumbTip = lms[4];
  const thumbOut = d(thumbTip, lms[5]) > 0.6 * scale && d(thumbTip, lms[17]) > 0.9 * scale;
  const thumbIndexTouch = d(thumbTip, lms[8]) < 0.5 * scale;
  const spreadIM = d(lms[8], lms[12]); // distância entre pontas indicador-médio

  // Amplitude de movimento da ponta (para J/Z)
  const range = (sel: (m: MotionPoint) => number) => {
    if (!history || history.length < 6) return 0;
    const v = history.map(sel);
    return Math.max(...v) - Math.min(...v);
  };
  const idxXRange = range((m) => m.ix);
  const idxYRange = range((m) => m.iy);
  const pnkYRange = range((m) => m.py);
  const pnkXRange = range((m) => m.px);

  const mk = (letter: string, description: string, confidence: 'high' | 'medium' | 'low' = 'high'): LibrasResult =>
    ({ letter, description, confidence });

  // ── Mindinho (I / Y / J) ──
  if (eP && cI && cM && cR) {
    if (thumbOut) return mk('Y', 'Mindinho e polegar', 'high');
    if (pnkYRange > 0.10 || pnkXRange > 0.10) return mk('J', 'Mindinho desenhando J', 'medium');
    return mk('I', 'Apenas mindinho', 'high');
  }

  // ── Indicador (D / Z) ──
  if (eI && cM && cR && cP && !thumbOut) {
    if (idxXRange > 0.12 && idxYRange > 0.05) return mk('Z', 'Indicador desenhando Z', 'medium');
    return mk('D', 'Indicador para cima', 'high');
  }

  // ── L: indicador + polegar ──
  if (eI && thumbOut && !eM && !eR && !eP) return mk('L', 'Forma de L', 'high');

  // ── X: indicador dobrado (gancho) ──
  if (sI === 'bent' && cM && cR && cP) return mk('X', 'Indicador dobrado', 'medium');

  // ── Indicador + médio (R / V / U) ──
  if (eI && eM && !eR && !eP) {
    const crossed = (lms[8].x - lms[12].x) * (lms[5].x - lms[9].x) < -0.0003;
    if (crossed) return mk('R', 'Indicador e médio cruzados', 'medium');
    if (spreadIM > 0.5 * scale) return mk('V', 'V — dedos afastados', 'high');
    return mk('U', 'Dois dedos juntos', 'high');
  }

  // ── W: 3 dedos ──
  if (eI && eM && eR && !eP) return mk('W', 'Três dedos abertos', 'high');

  // ── F: indicador toca o polegar, 3 dedos em pé ──
  if (thumbIndexTouch && eM && eR && eP) return mk('F', 'Indicador toca o polegar', 'high');

  // ── B: 4 dedos juntos, polegar atravessado ──
  if (eI && eM && eR && eP && !thumbOut) return mk('B', '4 dedos juntos', 'high');

  // ── Mão fechada / curvada (O / C / A / S / E) ──
  if (extCount === 0) {
    const tips = [lms[8], lms[12], lms[16], lms[20]];
    const tipsToThumb = tips.reduce((s, t) => s + d(t, thumbTip), 0) / 4;
    const allCurl = cI && cM && cR && cP;

    // O: pontas formam círculo encontrando o polegar
    if (!allCurl && tipsToThumb < 0.55 * scale) return mk('O', 'Dedos em círculo', 'medium');
    // C: mão curvada com abertura em C
    if (!allCurl && tipsToThumb >= 0.55 * scale && tipsToThumb < 1.4 * scale)
      return mk('C', 'Mão curvada em C', 'medium');

    // Punho (A / S / E)
    if (allCurl) {
      if (thumbOut) return mk('A', 'Punho, polegar ao lado', 'medium');
      const minK = Math.min(lms[6].x, lms[10].x) - 0.04;
      const maxK = Math.max(lms[6].x, lms[10].x) + 0.04;
      if (thumbTip.x > minK && thumbTip.x < maxK) return mk('S', 'Punho, polegar na frente', 'low');
      return mk('E', 'Punho fechado', 'low');
    }
  }

  return { letter: null, description: '', confidence: 'low' };
}

// Guia visual dos sinais suportados (sem emoji). Marca os de movimento.
export const LIBRAS_GUIDE: Array<{ letter: string; hint: string }> = [
  { letter: 'A', hint: 'Punho, polegar ao lado' },
  { letter: 'B', hint: '4 dedos juntos' },
  { letter: 'C', hint: 'Mão em C' },
  { letter: 'D', hint: 'Indicador p/ cima' },
  { letter: 'E', hint: 'Punho fechado' },
  { letter: 'F', hint: 'Indicador no polegar' },
  { letter: 'I', hint: 'Mindinho' },
  { letter: 'J', hint: 'Mindinho (mexer)' },
  { letter: 'L', hint: 'Forma de L' },
  { letter: 'O', hint: 'Dedos em círculo' },
  { letter: 'R', hint: 'Indicador+médio cruzados' },
  { letter: 'S', hint: 'Punho, polegar na frente' },
  { letter: 'U', hint: '2 dedos juntos' },
  { letter: 'V', hint: '2 dedos abertos' },
  { letter: 'W', hint: '3 dedos' },
  { letter: 'X', hint: 'Indicador dobrado' },
  { letter: 'Y', hint: 'Mindinho + polegar' },
  { letter: 'Z', hint: 'Indicador (mexer)' },
];

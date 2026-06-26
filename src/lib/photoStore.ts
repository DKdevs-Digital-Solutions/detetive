// Guarda temporariamente a foto (polaroid) de cada sessão, em memória, ligada ao
// código da sessão de controle. O totem compõe a foto e faz upload; quando o
// celular envia o certificado, o servidor anexa a foto e a APAGA em seguida.
// Nada é gravado em disco (privacidade — são fotos de visitantes).

interface Entry {
  dataUrl: string; // "data:image/jpeg;base64,..."
  ts: number;
}

interface Store {
  photos: Map<string, Entry>;
}

const g = globalThis as unknown as { __detetivePhotos?: Store };

function store(): Store {
  if (!g.__detetivePhotos) g.__detetivePhotos = { photos: new Map() };
  return g.__detetivePhotos;
}

const TTL = 10 * 60 * 1000; // foto abandonada expira em 10 min

function sweep(): void {
  const now = Date.now();
  const s = store();
  s.photos.forEach((e, code) => {
    if (now - e.ts > TTL) s.photos.delete(code);
  });
}

export function setPhoto(code: string, dataUrl: string): void {
  sweep();
  store().photos.set(code, { dataUrl, ts: Date.now() });
}

export function getPhoto(code: string): string | null {
  sweep();
  return store().photos.get(code)?.dataUrl ?? null;
}

export function clearPhoto(code: string): void {
  store().photos.delete(code);
}

export function hasPhoto(code: string): boolean {
  return getPhoto(code) !== null;
}

// Converte uma data URL de imagem em Buffer (para enviar pelo WhatsApp).
export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimetype: string } | null {
  const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  return { mimetype: m[1], buffer: Buffer.from(m[2], 'base64') };
}

import path from 'node:path';
import { Buffer } from 'node:buffer';
import { setTimeout as delay } from 'node:timers/promises';

// Conexão WhatsApp via Baileys. Para funcionar de forma confiável, este módulo
// precisa rodar em um processo Node persistente (totem, VPS ou container com volume).

type WAStatus = 'idle' | 'connecting' | 'qr' | 'open' | 'closed';

interface WAState {
  sock: any;
  status: WAStatus;
  qr: string | null;
  lastError: string | null;
  starting: boolean;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
}

const g = globalThis as any;

function state(): WAState {
  if (!g.__detetiveWA) {
    g.__detetiveWA = {
      sock: null,
      status: 'idle',
      qr: null,
      lastError: null,
      starting: false,
      reconnectTimer: null,
    } satisfies WAState;
  }
  return g.__detetiveWA as WAState;
}

function disconnectCode(error: any): number | undefined {
  return (
    error?.output?.statusCode ??
    error?.data?.statusCode ??
    error?.statusCode ??
    error?.cause?.output?.statusCode
  );
}

function errorText(error: any): string {
  const code = disconnectCode(error);
  const message = error?.message || error?.cause?.message || String(error || 'Conexão encerrada');
  return code ? `${message} (código ${code})` : message;
}

function scheduleReconnect(): void {
  const s = state();
  if (s.reconnectTimer) return;

  s.reconnectTimer = setTimeout(() => {
    s.reconnectTimer = null;
    initWhatsApp().catch((error) => {
      const current = state();
      current.lastError = errorText(error);
    });
  }, 2500);
}

export async function initWhatsApp(): Promise<void> {
  const s = state();
  if (s.status === 'open' || s.starting) return;

  s.starting = true;
  s.status = 'connecting';
  s.lastError = null;

  try {
    const baileys: any = await import('@whiskeysockets/baileys');
    const makeWASocket = baileys.default || baileys.makeWASocket;
    const { useMultiFileAuthState, DisconnectReason, Browsers } = baileys;
    const QRCode = (await import('qrcode')).default;
    const pino = (await import('pino')).default;

    const logger = pino({ level: process.env.BAILEYS_LOG_LEVEL || 'warn' });
    const authDir = process.env.BAILEYS_AUTH_DIR || path.join(process.cwd(), '.baileys_auth');
    const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: authState,
      printQRInTerminal: false,
      logger,
      browser: Browsers?.ubuntu
        ? Browsers.ubuntu('Detetive IA')
        : ['Ubuntu', 'Chrome', '20.0.04'],
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
    });

    s.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update: any) => {
      const current = state();
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          current.qr = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
          current.status = 'qr';
          current.lastError = null;
        } catch (error) {
          current.lastError = `Falha ao gerar QR: ${errorText(error)}`;
        }
      }

      if (connection === 'open') {
        current.status = 'open';
        current.qr = null;
        current.lastError = null;
        current.starting = false;
        return;
      }

      if (connection === 'close') {
        const error = lastDisconnect?.error;
        const code = disconnectCode(error);

        current.status = 'closed';
        current.sock = null;
        current.starting = false;
        current.lastError = errorText(error);

        if (code !== DisconnectReason.loggedOut) {
          scheduleReconnect();
        }
      }
    });
  } catch (error) {
    s.status = 'closed';
    s.sock = null;
    s.lastError = errorText(error);
    s.starting = false;
    throw error;
  }
}

export async function waitForWhatsAppOpen(timeoutMs = 10_000): Promise<boolean> {
  await initWhatsApp().catch(() => {});

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const s = state();
    if (s.status === 'open' && s.sock) return true;

    // Sem credenciais válidas, o organizador precisa escanear o QR no painel.
    if (s.status === 'qr') return false;

    await delay(250);
  }

  return false;
}

export function getWhatsAppStatus() {
  const s = state();
  return {
    status: s.status,
    qr: s.qr,
    error: s.lastError,
    connectedAs: s.sock?.user?.id || null,
  };
}

// Normaliza número brasileiro para dígitos com DDI 55.
export function normalizeBrazilPhone(input: string): string | null {
  let digits = (input || '').replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return null;

  if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }

  if (digits.length < 12 || digits.length > 13) return null;
  return digits;
}

export async function sendCertificate(
  phone: string,
  pdf: Uint8Array,
  fileName: string,
  caption: string
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const connected = await waitForWhatsAppOpen();
  const s = state();

  if (!connected || s.status !== 'open' || !s.sock) {
    return { ok: false, error: 'whatsapp-not-connected' };
  }

  const digits = normalizeBrazilPhone(phone);
  if (!digits) return { ok: false, error: 'invalid-phone' };

  try {
    let jid = `${digits}@s.whatsapp.net`;
    const result = await s.sock.onWhatsApp(digits);

    if (result?.length) {
      const contact = result.find((item: any) => item?.exists);
      if (!contact?.jid) return { ok: false, error: 'no-whatsapp' };
      jid = contact.jid;
    }

    const sent = await s.sock.sendMessage(jid, {
      document: Buffer.from(pdf),
      mimetype: 'application/pdf',
      fileName,
      caption,
    });

    if (!sent?.key?.id) {
      return { ok: false, error: 'send-without-message-id' };
    }

    return { ok: true, messageId: sent.key.id };
  } catch (error) {
    const message = errorText(error);
    state().lastError = message;
    console.error('[whatsapp] certificate send failed:', error);
    return { ok: false, error: message || 'send-failed' };
  }
}

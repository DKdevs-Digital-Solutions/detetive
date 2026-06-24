import path from 'node:path';
import fs from 'node:fs/promises';

// Histórico de certificados emitidos, para exportação (nome + contato).
// Persistido em arquivo JSONL num diretório de dados (volume), pois /app é
// recriado a cada boot no totem.

export interface CertRecord {
  ts: string;
  name: string;
  contact: string;            // telefone (só dígitos) ou email
  channel: 'whatsapp' | 'email';
  status: string;             // ex.: 'enviado', 'pendente'
}

function dataDir(): string {
  if (process.env.CERT_DATA_DIR) return process.env.CERT_DATA_DIR;
  if (process.env.BAILEYS_AUTH_DIR) return path.dirname(process.env.BAILEYS_AUTH_DIR);
  return process.cwd();
}

function filePath(): string {
  return path.join(dataDir(), 'certificados.jsonl');
}

export async function appendCertRecord(rec: Omit<CertRecord, 'ts'>): Promise<void> {
  const file = filePath();
  const line = `${JSON.stringify({ ts: new Date().toISOString(), ...rec })}\n`;
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.appendFile(file, line, 'utf8');
  } catch (error) {
    console.error('[certLog] append failed:', error);
  }
}

export async function readCertRecords(): Promise<CertRecord[]> {
  try {
    const raw = await fs.readFile(filePath(), 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((l) => {
        try { return JSON.parse(l) as CertRecord; } catch { return null; }
      })
      .filter((r): r is CertRecord => r !== null);
  } catch {
    return [];
  }
}

export function toCsv(records: CertRecord[]): string {
  const header = 'data,nome,contato,canal,status';
  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = records.map((r) =>
    [r.ts, r.name, r.contact, r.channel, r.status].map(esc).join(',')
  );
  return [header, ...rows].join('\n');
}

// Pré-grava em MP3 todos os áudios FIXOS da narração (intros, fechamentos,
// itens do checklist, exemplos de erros, lições de notícia, parabéns).
//
// Como usar:
//   1) Em um terminal:  npm run dev   (precisa ter ELEVENLABS_API_KEY no .env.local)
//   2) Em outro:        npm run gen:audio        (ou: npm run gen:audio -- --force)
//
// Os arquivos vão para public/audio/<id>.mp3 e devem ser commitados, pois o
// totem clona o repositório no boot. Depois disso, a ElevenLabs ao vivo só é
// usada no quiz e na conversa livre.

import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const OUT = path.join(process.cwd(), 'public', 'audio');
const FORCE = process.argv.includes('--force');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

async function main() {
  await mkdir(OUT, { recursive: true });

  const res = await fetch(`${BASE}/api/narration`);
  if (!res.ok) {
    throw new Error(`Não consegui ler o manifesto (${res.status}). O servidor está rodando em ${BASE}? (npm run dev)`);
  }
  const { clips } = await res.json();
  console.log(`${clips.length} clipes no manifesto.\n`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const clip of clips) {
    const file = path.join(OUT, `${clip.id}.mp3`);
    if (!FORCE && (await exists(file))) {
      skip += 1;
      console.log(`= ${clip.id} (já existe, pulando)`);
      continue;
    }
    try {
      const r = await fetch(`${BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clip.text }),
      });
      if (r.status === 503) throw new Error('ELEVENLABS_API_KEY não configurada no servidor');
      if (!r.ok) throw new Error(`tts retornou ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (!buf.length) throw new Error('áudio vazio');
      await writeFile(file, buf);
      ok += 1;
      console.log(`✓ ${clip.id}  (${(buf.length / 1024).toFixed(0)} KB)`);
      await sleep(350); // gentileza com a API
    } catch (error) {
      fail += 1;
      console.error(`✗ ${clip.id}: ${error.message}`);
    }
  }

  console.log(`\nPronto. Gerados: ${ok} · pulados: ${skip} · falhas: ${fail}`);
  console.log('Arquivos em public/audio/. Lembre de commitar para o totem usar.');
}

main().catch((error) => {
  console.error(`\nErro: ${error.message}`);
  process.exit(1);
});

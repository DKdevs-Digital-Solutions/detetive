import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Gera áudio neural (voz humanizada) via ElevenLabs.
// Recebe { text } e devolve audio/mpeg. Se a key não estiver configurada,
// retorna 503 — o cliente faz fallback automático para a voz do navegador.
export async function POST(request: NextRequest) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: 'no-key' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let text = '';
  try {
    const body = await request.json();
    text = (body.text || '').toString().slice(0, 800); // limite de segurança
  } catch {
    return new Response(JSON.stringify({ error: 'bad-request' }), { status: 400 });
  }

  if (!text.trim()) {
    return new Response(JSON.stringify({ error: 'empty' }), { status: 400 });
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
  const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128';
  const languageCode = (process.env.ELEVENLABS_LANGUAGE_CODE || '').trim();

  // Lê os sliders do .env com fallback e clamp para faixas válidas
  const num = (v: string | undefined, def: number, min: number, max: number) => {
    const n = parseFloat((v ?? '').toString());
    if (Number.isNaN(n)) return def;
    return Math.min(max, Math.max(min, n));
  };
  const voiceSettings: Record<string, number | boolean> = {
    stability:        num(process.env.ELEVENLABS_STABILITY, 0.9, 0, 1),
    similarity_boost: num(process.env.ELEVENLABS_SIMILARITY, 0.3, 0, 1),
    style:            num(process.env.ELEVENLABS_STYLE, 0, 0, 1),
    speed:            num(process.env.ELEVENLABS_SPEED, 0.95, 0.7, 1.2),
    use_speaker_boost: (process.env.ELEVENLABS_SPEAKER_BOOST ?? 'true').toLowerCase() !== 'false',
  };

  const payload: Record<string, unknown> = {
    text,
    model_id: modelId,
    voice_settings: voiceSettings,
  };
  if (languageCode) payload.language_code = languageCode;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('[tts] ElevenLabs error:', res.status, detail);
      return new Response(JSON.stringify({ error: 'tts-failed', status: res.status }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[tts] fetch error:', error);
    return new Response(JSON.stringify({ error: 'network' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

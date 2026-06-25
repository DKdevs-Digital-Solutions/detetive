import { NextRequest } from 'next/server';
import { addClient } from '@/lib/controlBus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// SSE: display e controlador assinam aqui com ?code=XXXX e recebem os comandos da sala.
export async function GET(request: NextRequest) {
  const room = (new URL(request.url).searchParams.get('code') || '').trim().toUpperCase();
  if (!room) return new Response('missing code', { status: 400 });

  const encoder = new TextEncoder();
  let remove: () => void = () => {};
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try { controller.enqueue(encoder.encode(chunk)); } catch { /* fechado */ }
      };
      send('retry: 3000\n\n');
      send(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
      remove = addClient(room, send);
      heartbeat = setInterval(() => send(': ping\n\n'), 20000); // mantém viva a conexão
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      remove();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

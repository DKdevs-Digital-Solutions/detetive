// Barramento de controle remoto (display PC <-> celular/tablet controlador).
// O display e o controlador abrem um stream SSE da mesma "sala"; quem envia um
// comando via POST tem a mensagem repassada para todos os conectados da sala.
// Estado em globalThis: funciona num único processo Node (Portainer/totem).

interface Client {
  id: number;
  send: (chunk: string) => void;
}

interface Bus {
  rooms: Map<string, Set<Client>>;
  nextId: number;
}

const g = globalThis as unknown as { __detetiveControl?: Bus };

function bus(): Bus {
  if (!g.__detetiveControl) {
    g.__detetiveControl = { rooms: new Map(), nextId: 1 };
  }
  return g.__detetiveControl;
}

// Registra um cliente (display ou controlador). Retorna a função de remoção.
export function addClient(room: string, send: (chunk: string) => void): () => void {
  const b = bus();
  const client: Client = { id: b.nextId++, send };
  let set = b.rooms.get(room);
  if (!set) {
    set = new Set();
    b.rooms.set(room, set);
  }
  set.add(client);

  return () => {
    const s = b.rooms.get(room);
    if (!s) return;
    s.delete(client);
    if (s.size === 0) b.rooms.delete(room);
  };
}

// Empurra um comando para todos da sala. Retorna quantos receberam.
export function pushCommand(room: string, command: unknown): number {
  const set = bus().rooms.get(room);
  if (!set || set.size === 0) return 0;
  const payload = `data: ${JSON.stringify(command)}\n\n`;
  let n = 0;
  set.forEach((c) => {
    try {
      c.send(payload);
      n++;
    } catch {
      /* cliente caiu; será removido no cancel do stream */
    }
  });
  return n;
}

export function clientsOnline(room: string): number {
  return bus().rooms.get(room)?.size ?? 0;
}

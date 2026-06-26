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
  owners: Map<string, { owner: string; ts: number }>; // exclusividade por sala
  nextId: number;
}

const g = globalThis as unknown as { __detetiveControl?: Bus };

function bus(): Bus {
  if (!g.__detetiveControl) {
    g.__detetiveControl = { rooms: new Map(), owners: new Map(), nextId: 1 };
  }
  return g.__detetiveControl;
}

const OWNER_TTL = 15000; // o dono precisa renovar a posse a cada 15s

// Reivindica o controle de uma sala. Concede ao primeiro; renova para o mesmo
// dono; libera se o dono atual ficou inativo (TTL). Retorna se foi concedido.
export function claimRoom(room: string, controllerId: string): { granted: boolean; owner: string } {
  const b = bus();
  const now = Date.now();
  const cur = b.owners.get(room);
  if (!cur || cur.owner === controllerId || now - cur.ts > OWNER_TTL) {
    b.owners.set(room, { owner: controllerId, ts: now });
    return { granted: true, owner: controllerId };
  }
  return { granted: false, owner: cur.owner };
}

export function releaseRoom(room: string, controllerId: string): void {
  const b = bus();
  const cur = b.owners.get(room);
  if (cur && cur.owner === controllerId) b.owners.delete(room);
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

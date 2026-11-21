// Serveur de jeu Hand of Realms : WebSocket, JSON, un salon par nom.
// Usage : npm run server  (PORT=8080 par défaut)
import { WebSocketServer, type WebSocket } from 'ws';
import cardsData from '../../data/hotg-cards.json' with { type: 'json' };
import type { Card } from '../cards.js';
import type { Action, PlayerId } from '../engine.js';
import { Room, type Outbound } from './room.js';

type ClientMsg =
  | { type: 'join'; room: string; name: string; pantheon: string }
  | { type: 'action'; action: Action };

export async function startServer(opts: { port: number; seed?: number }) {
  const rooms = new Map<string, { room: Room; sockets: (WebSocket | undefined)[] }>();
  const wss = new WebSocketServer({ port: opts.port });
  await new Promise<void>(r => wss.once('listening', () => r()));
  const send = (ws: WebSocket | undefined, msg: unknown) => ws?.readyState === ws?.OPEN && ws?.send(JSON.stringify(msg));

  wss.on('connection', ws => {
    let joined: { key: string; seat: PlayerId } | null = null;
    const dispatch = (key: string, out: Outbound[]) => {
      const entry = rooms.get(key)!;
      for (const o of out) send(entry.sockets[o.seat], o.msg);
    };
    ws.on('message', raw => {
      let msg: ClientMsg;
      try { msg = JSON.parse(String(raw)); } catch { return send(ws, { type: 'error', message: 'Message invalide (JSON attendu)' }); }
      try {
        if (msg.type === 'join') {
          if (joined) return send(ws, { type: 'error', message: 'Déjà dans un salon' });
          const key = String(msg.room || 'default');
          if (!rooms.has(key)) rooms.set(key, { room: new Room(cardsData as Card[], opts.seed ?? Date.now(), key), sockets: [] });
          const entry = rooms.get(key)!;
          const seat = entry.room.size as PlayerId;
          const out = entry.room.join(String(msg.name || `J${seat + 1}`), String(msg.pantheon || 'Greek'));
          entry.sockets[seat] = ws;
          joined = { key, seat };
          return dispatch(key, out);
        }
        if (msg.type === 'action') {
          if (!joined) return send(ws, { type: 'error', message: 'Rejoignez d\'abord un salon' });
          return dispatch(joined.key, rooms.get(joined.key)!.room.act(joined.seat, msg.action));
        }
        send(ws, { type: 'error', message: 'Type de message invalide' });
      } catch (e) {
        send(ws, { type: 'error', message: (e as Error).message });
      }
    });
    ws.on('close', () => {
      if (!joined) return;
      const entry = rooms.get(joined.key);
      if (!entry) return;
      entry.sockets[joined.seat] = undefined;
      if (entry.sockets.every(s => !s)) rooms.delete(joined.key);
    });
  });

  const addr = wss.address();
  return { port: typeof addr === 'object' && addr ? addr.port : opts.port, close: () => new Promise<void>(r => wss.close(() => r())) };
}

if (process.argv[1]?.endsWith('main.ts') || process.argv[1]?.endsWith('main.js')) {
  const port = Number(process.env.PORT ?? 8080);
  startServer({ port }).then(s => console.log(`Serveur Hand of Realms sur ws://localhost:${s.port}`));
}

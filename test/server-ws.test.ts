import { describe, it, expect, afterAll } from 'vitest';
import WebSocket from 'ws';
import { startServer } from '../src/server/main.js';

const srv = await startServer({ port: 0, seed: 3 });
afterAll(() => srv.close());
const url = () => `ws://127.0.0.1:${srv.port}`;

function client() {
  const ws = new WebSocket(url());
  const inbox: any[] = [];
  const waiters: (() => void)[] = [];
  ws.on('message', d => { inbox.push(JSON.parse(String(d))); waiters.splice(0).forEach(f => f()); });
  const next = async (type: string) => {
    for (;;) {
      const i = inbox.findIndex(m => m.type === type);
      if (i >= 0) return inbox.splice(i, 1)[0];
      await new Promise<void>(r => waiters.push(r));
    }
  };
  return { ws, next, send: (m: unknown) => ws.send(JSON.stringify(m)), open: new Promise(r => ws.on('open', r)) };
}

describe('serveur WebSocket', () => {
  it('deux clients rejoignent un salon, jouent un tour et reçoivent les événements', async () => {
    const a = client(), b = client();
    await Promise.all([a.open, b.open]);
    a.send({ type: 'join', room: 'test', name: 'Ana', pantheon: 'Greek' });
    expect((await a.next('joined')).seat).toBe(0);
    b.send({ type: 'join', room: 'test', name: 'Bob', pantheon: 'Norse' });
    expect((await b.next('joined')).seat).toBe(1);
    const sa = await a.next('state');
    await b.next('state');
    const active = sa.view.active === 0 ? a : b;
    active.send({ type: 'action', action: { type: 'endTurn' } });
    const ev = await a.next('events');
    expect(ev.events[0]).toMatchObject({ type: 'turnStarted' });
    await b.next('events');
    a.ws.close(); b.ws.close();
  });

  it('répond par une erreur à un message invalide', async () => {
    const c = client();
    await c.open;
    c.ws.send('pas du json');
    expect((await c.next('error')).message).toMatch(/invalide/i);
    c.ws.close();
  });
});

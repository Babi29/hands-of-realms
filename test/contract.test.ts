// Contrat serveur -> client Unity : des messages réels du serveur sont figés dans
// client-unity/Tests.Core/fixtures, et les tests C# vérifient qu'ils se lisent.
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { loadCards } from '../src/cards.js';
import { Room } from '../src/server/room.js';

const FIXTURE = new URL('../client-unity/Tests.Core/fixtures/server-session.json', import.meta.url);

function session() {
  const r = new Room(loadCards(), 5);
  const msgs: unknown[] = [];
  r.join('Ana', 'Greek');
  msgs.push(...r.join('Bob', 'Norse').filter(o => o.seat === 0).map(o => o.msg));
  for (let i = 0; i < 6; i++) {
    const me = r.game!.active;
    const view = r.game!;
    const card = view.players[me].hand.findIndex(c => c.type !== 'Item' && (c.mana ?? 99) <= view.players[me].mana);
    if (card >= 0) {
      const crystal = view.players[me].crystal;
      const cell = `${'ABCDE'[crystal.row - 1]}${crystal.col + 1}`;
      msgs.push(...r.act(me, { type: 'play', handIndex: card, cell }).filter(o => o.seat === 0).map(o => o.msg));
    }
    msgs.push(...r.act(me, { type: 'endTurn' }).filter(o => o.seat === 0).map(o => o.msg));
  }
  return msgs;
}

describe('contrat avec le client Unity', () => {
  it('les messages du serveur correspondent à la fixture commitée', () => {
    const json = JSON.stringify(session(), null, 1) + '\n';
    if (process.env.UPDATE_FIXTURES || !existsSync(FIXTURE)) writeFileSync(FIXTURE, json);
    expect(readFileSync(FIXTURE, 'utf8')).toBe(json);
  });
});

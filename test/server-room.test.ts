import { describe, it, expect } from 'vitest';
import { loadCards } from '../src/cards.js';
import { Room, type Outbound } from '../src/server/room.js';

const cards = loadCards();
const byType = (out: Outbound[], seat: number, type: string) => out.filter(o => o.seat === seat && o.msg.type === type);

describe('salon de jeu', () => {
  it('attribue les sièges 0 puis 1, et refuse un troisième joueur', () => {
    const r = new Room(cards, 1);
    expect(r.join('Ana', 'Greek').find(o => o.msg.type === 'joined')).toMatchObject({ seat: 0, msg: { type: 'joined', seat: 0 } });
    expect(r.join('Bob', 'Norse').find(o => o.msg.type === 'joined')).toMatchObject({ seat: 1 });
    expect(() => r.join('Eve', 'Roman')).toThrow(/complet/);
  });

  it('démarre la partie au second joueur et envoie à chacun sa propre vue', () => {
    const r = new Room(cards, 1);
    r.join('Ana', 'Greek');
    const out = r.join('Bob', 'Norse');
    const s0 = byType(out, 0, 'state')[0]!.msg as Extract<Outbound['msg'], { type: 'state' }>;
    const s1 = byType(out, 1, 'state')[0]!.msg as Extract<Outbound['msg'], { type: 'state' }>;
    expect(s0.view.you).toBe(0);
    expect(s1.view.you).toBe(1);
    expect(s0.view.players[1].hand).toBeNull();
    expect(s0.view.names).toEqual(['Ana', 'Bob']);
    expect(s0.view.pantheons).toEqual(['Greek', 'Norse']);
  });

  it('refuse une action avant le début ou hors de son tour', () => {
    const r = new Room(cards, 1);
    r.join('Ana', 'Greek');
    expect(r.act(0, { type: 'endTurn' })).toEqual([{ seat: 0, msg: { type: 'error', message: 'La partie n\'a pas commencé' } }]);
    r.join('Bob', 'Norse');
    const idle = (r.game!.active === 0 ? 1 : 0);
    expect(r.act(idle, { type: 'endTurn' })[0]).toMatchObject({ seat: idle, msg: { type: 'error', message: 'Ce n\'est pas votre tour' } });
  });

  it('applique une action valide et diffuse événements puis état aux deux joueurs', () => {
    const r = new Room(cards, 1);
    r.join('Ana', 'Greek');
    r.join('Bob', 'Norse');
    const me = r.game!.active;
    const out = r.act(me, { type: 'endTurn' });
    for (const seat of [0, 1]) {
      const msgs = out.filter(o => o.seat === seat).map(o => o.msg.type);
      expect(msgs).toEqual(['events', 'state']);
    }
    expect(r.game!.active).toBe(me === 0 ? 1 : 0);
  });

  it('renvoie l\'erreur du moteur au seul joueur fautif', () => {
    const r = new Room(cards, 1);
    r.join('Ana', 'Greek');
    r.join('Bob', 'Norse');
    const out = r.act(r.game!.active, { type: 'move', unitId: 999, cell: 'A1' });
    expect(out).toHaveLength(1);
    expect(out[0]!.msg).toMatchObject({ type: 'error' });
  });

});

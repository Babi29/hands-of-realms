import { describe, it, expect } from 'vitest';
import { newGame, apply, MANA_TOKEN, MAX_HAND } from '../src/engine.js';
import { deckOf } from './helpers.js';

const start = () => newGame({ decks: [deckOf(25, 'A'), deckOf(25, 'B')], first: 0 });

describe('tours', () => {
  it('passe la main à l\'adversaire, qui démarre à 2 mana et pioche', () => {
    const g = apply(start(), { type: 'endTurn' });
    expect(g.active).toBe(1);
    expect(g.turn).toBe(2);
    expect(g.players[1]).toMatchObject({ mana: 2, maxMana: 2 });
    expect(g.players[1].hand).toHaveLength(6);
  });

  it('augmente la mana max de 1 par tour, jusqu\'à 10, et la recharge', () => {
    let g = start();
    const seen: number[] = [];
    for (let i = 0; i < 24; i++) {
      if (g.active === 0) seen.push(g.players[0].maxMana);
      g = apply(g, { type: 'endTurn' });
    }
    expect(seen).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]);
  });

  it('la carte Mana donne +1 mana pour le tour, sans changer le maximum', () => {
    let g = apply(start(), { type: 'endTurn' });
    const idx = g.players[1].hand.findIndex(c => c.name === MANA_TOKEN.name);
    g = apply(g, { type: 'play', handIndex: idx });
    expect(g.players[1]).toMatchObject({ mana: 3, maxMana: 2 });
    expect(g.players[1].hand.some(c => c.name === MANA_TOKEN.name)).toBe(false);
    g = apply(apply(g, { type: 'endTurn' }), { type: 'endTurn' });
    expect(g.players[1]).toMatchObject({ mana: 3, maxMana: 3 });
  });

  it('défausse la carte piochée quand la main est pleine (7)', () => {
    let g = start();
    for (let i = 0; i < 8; i++) g = apply(g, { type: 'endTurn' });
    expect(MAX_HAND).toBe(7);
    expect(g.players[0].hand).toHaveLength(7);
    expect(g.players[0].deck.length).toBeLessThan(21 - 3);
  });

  it('inflige des dégâts croissants au cristal quand le deck est vide (1, 2, 3…)', () => {
    let g = newGame({ decks: [deckOf(4, 'A'), deckOf(25, 'B')], first: 0 });
    expect(g.players[0].deck).toHaveLength(0);
    const hp: number[] = [];
    for (let i = 0; i < 3; i++) {
      g = apply(apply(g, { type: 'endTurn' }), { type: 'endTurn' });
      hp.push(g.players[0].crystalHp);
    }
    expect(hp).toEqual([24, 22, 19]);
  });

  it('refuse toute action une fois la partie terminée', () => {
    const g = { ...start(), winner: 1 as const };
    expect(() => apply(g, { type: 'endTurn' })).toThrow(/terminée/);
  });
});

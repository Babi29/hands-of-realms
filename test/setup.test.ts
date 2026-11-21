import { describe, it, expect } from 'vitest';
import { newGame, MANA_TOKEN } from '../src/engine.js';
import { deckOf } from './helpers.js';

describe('mise en place', () => {
  const g = newGame({ decks: [deckOf(25, 'A'), deckOf(25, 'B')], first: 0 });

  it('place les cristaux en C2 (J1) et C7 (J2) à 25 PV', () => {
    expect(g.players[0]).toMatchObject({ crystal: { row: 2, col: 1 }, crystalHp: 25 });
    expect(g.players[1]).toMatchObject({ crystal: { row: 2, col: 6 }, crystalHp: 25 });
  });

  it('donne 3 cartes au premier joueur, puis il pioche 1 carte en début de tour', () => {
    expect(g.active).toBe(0);
    expect(g.players[0].hand.map(c => c.name)).toEqual(['A0', 'A1', 'A2', 'A3']);
    expect(g.players[0].deck).toHaveLength(21);
  });

  it('donne 4 cartes et une carte Mana au second joueur', () => {
    expect(g.players[1].hand.map(c => c.name)).toEqual(['B0', 'B1', 'B2', 'B3', MANA_TOKEN.name]);
    expect(g.players[1].deck).toHaveLength(21);
  });

  it('commence le premier joueur à 2 mana', () => {
    expect(g.players[0]).toMatchObject({ mana: 2, maxMana: 2 });
    expect(g.turn).toBe(1);
    expect(g.winner).toBeNull();
  });

  it('respecte le choix du premier joueur', () => {
    const g2 = newGame({ decks: [deckOf(25, 'A'), deckOf(25, 'B')], first: 1 });
    expect(g2.active).toBe(1);
    expect(g2.players[1].hand).toHaveLength(4);
    expect(g2.players[0].hand.at(-1)!.name).toBe(MANA_TOKEN.name);
  });
});

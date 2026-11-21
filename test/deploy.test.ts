import { describe, it, expect } from 'vitest';
import { apply } from '../src/engine.js';
import { arena, unitCard } from './helpers.js';

const withHand = (cards = [unitCard('Hoplite', { mana: 3, attack: 2, health: 4, movement: 2 })]) => {
  const g = arena(0);
  return { ...g, players: [{ ...g.players[0], hand: cards }, g.players[1]] as const };
};

describe('déploiement', () => {
  it('pose une unité sur une case libre autour de son cristal et paie son coût', () => {
    const g = apply(withHand(), { type: 'play', handIndex: 0, cell: 'B1' });
    expect(g.units).toHaveLength(1);
    expect(g.units[0]).toMatchObject({ name: 'Hoplite', owner: 0, pos: { row: 1, col: 0 }, attack: 2, health: 4, movement: 2, exhausted: true });
    expect(g.players[0].mana).toBe(7);
    expect(g.players[0].hand).toHaveLength(0);
  });

  it('accepte les 8 cases autour du cristal, diagonales comprises', () => {
    for (const cell of ['B1', 'B2', 'B3', 'C1', 'C3', 'D1', 'D2', 'D3'])
      expect(() => apply(withHand(), { type: 'play', handIndex: 0, cell }), cell).not.toThrow();
  });

  it('refuse une case loin du cristal, occupée, ou le cristal lui-même', () => {
    expect(() => apply(withHand(), { type: 'play', handIndex: 0, cell: 'C4' })).toThrow();
    expect(() => apply(withHand(), { type: 'play', handIndex: 0, cell: 'C2' })).toThrow();
    const g = apply(withHand([unitCard('a'), unitCard('b')]), { type: 'play', handIndex: 0, cell: 'B1' });
    expect(() => apply(g, { type: 'play', handIndex: 0, cell: 'B1' })).toThrow(/occupée/);
  });

  it('refuse une carte trop chère', () => {
    const g = withHand([unitCard('Titan', { mana: 11 })]);
    expect(() => apply(g, { type: 'play', handIndex: 0, cell: 'B1' })).toThrow(/mana/);
  });

  it('rend l\'unité épuisée : ni déplacement ni attaque avant son prochain tour', () => {
    let g = apply(withHand(), { type: 'play', handIndex: 0, cell: 'C3' });
    const id = g.units[0]!.id;
    expect(() => apply(g, { type: 'move', unitId: id, cell: 'C4' })).toThrow(/épuisée/);
    g = apply(apply(g, { type: 'endTurn' }), { type: 'endTurn' });
    expect(g.units[0]!.exhausted).toBe(false);
    expect(() => apply(g, { type: 'move', unitId: id, cell: 'C4' })).not.toThrow();
  });
});

import { deployCells } from '../src/engine.js';
describe('cases de déploiement', () => {
  it('liste les cases libres autour du cristal du joueur actif', () => {
    expect(deployCells(arena(0)).sort()).toEqual(['B1', 'B2', 'B3', 'C1', 'C3', 'D1', 'D2', 'D3']);
    expect(deployCells(arena(1)).sort()).toEqual(['B6', 'B7', 'B8', 'C6', 'C8', 'D6', 'D7', 'D8']);
  });
});

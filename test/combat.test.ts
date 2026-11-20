import { describe, it, expect } from 'vitest';
import { apply, placeUnit, reachableCells, attackableCells, type GameState } from '../src/engine.js';
import { arena, unitCard } from './helpers.js';

const melee = (o = {}) => unitCard('Guerrier', { attack: 2, health: 3, movement: 2, attackRange: 'melee', ...o });
const archer = (o = {}) => unitCard('Archer', { attack: 2, health: 2, movement: 2, attackRange: 'ranged', ...o });
const id = (g: GameState, cell: string) => g.units.find(u => `${'ABCDE'[u.pos.row]}${u.pos.col + 1}` === cell)!.id;
const hp = (g: GameState, cell: string) => g.units.find(u => `${'ABCDE'[u.pos.row]}${u.pos.col + 1}` === cell)?.health;

describe('déplacement', () => {
  it('se déplace en orthogonal jusqu\'à sa valeur de déplacement', () => {
    const g = placeUnit(arena(), 0, melee({ movement: 2 }), 'C4');
    // C2 (cristal) est exclu.
    expect(reachableCells(g, id(g, 'C4')).sort()).toEqual(['A4', 'B3', 'B4', 'B5', 'C3', 'C5', 'C6', 'D3', 'D4', 'D5', 'E4']);
  });

  it('traverse les alliés mais pas les ennemis, et ne s\'arrête pas sur une case occupée', () => {
    let g = placeUnit(arena(), 0, melee({ movement: 2 }), 'A1');
    g = placeUnit(g, 0, melee(), 'A2');
    g = placeUnit(g, 1, melee(), 'B1');
    const cells = reachableCells(g, id(g, 'A1'));
    expect(cells).toContain('A3');
    expect(cells).not.toContain('A2');
    expect(cells).not.toContain('B1');
    expect(cells).not.toContain('C1');
  });

  it('ne traverse pas les cristaux', () => {
    const g = placeUnit(arena(), 0, melee({ movement: 2 }), 'C1');
    expect(reachableCells(g, id(g, 'C1'))).not.toContain('C3');
  });

  it('un seul déplacement par tour, et pas de déplacement après une attaque', () => {
    let g = placeUnit(arena(), 0, melee(), 'C4');
    g = placeUnit(g, 1, melee({ health: 9 }), 'C5');
    const u = id(g, 'C4');
    const moved = apply(g, { type: 'move', unitId: u, cell: 'B4' });
    expect(() => apply(moved, { type: 'move', unitId: u, cell: 'A4' })).toThrow();
    const attacked = apply(g, { type: 'attack', unitId: u, cell: 'C5' });
    expect(() => apply(attacked, { type: 'move', unitId: u, cell: 'B4' })).toThrow();
  });

  it('peut se déplacer puis attaquer', () => {
    let g = placeUnit(arena(), 0, melee({ movement: 1 }), 'C4');
    g = placeUnit(g, 1, melee({ health: 9 }), 'C6');
    g = apply(g, { type: 'move', unitId: id(g, 'C4'), cell: 'C5' });
    expect(() => apply(g, { type: 'attack', unitId: id(g, 'C5'), cell: 'C6' })).not.toThrow();
  });

  it('refuse de déplacer une unité adverse', () => {
    const g = placeUnit(arena(0), 1, melee(), 'C5');
    expect(() => apply(g, { type: 'move', unitId: id(g, 'C5'), cell: 'C4' })).toThrow();
  });
});

describe('attaque', () => {
  it('la mêlée touche les 8 cases voisines, diagonales comprises', () => {
    let g = placeUnit(arena(), 0, melee(), 'C4');
    for (const c of ['B3', 'B4', 'B5', 'C3', 'C5', 'D3', 'D4', 'D5', 'A4', 'C6']) g = placeUnit(g, 1, melee(), c);
    expect(attackableCells(g, id(g, 'C4')).sort()).toEqual(['B3', 'B4', 'B5', 'C3', 'C5', 'D3', 'D4', 'D5']);
  });

  it('le tir touche à 3 cases ou moins en distance orthogonale', () => {
    let g = placeUnit(arena(), 0, archer(), 'C4');
    for (const c of ['C7', 'C8', 'A5', 'A6', 'E4', 'D5']) if (c !== 'C7') g = placeUnit(g, 1, melee(), c);
    const t = attackableCells(g, id(g, 'C4')).sort();
    expect(t).toEqual(['A5', 'C7', 'D5', 'E4']); // C7 = cristal adverse (distance 3)
  });

  it('ne cible ni ses alliés ni les cases vides', () => {
    let g = placeUnit(arena(), 0, melee(), 'C4');
    g = placeUnit(g, 0, melee(), 'C5');
    expect(attackableCells(g, id(g, 'C4'))).toEqual([]);
    expect(() => apply(g, { type: 'attack', unitId: id(g, 'C4'), cell: 'C5' })).toThrow();
    expect(() => apply(g, { type: 'attack', unitId: id(g, 'C4'), cell: 'B4' })).toThrow();
  });

  it('en mêlée, le défenseur qui survit riposte', () => {
    let g = placeUnit(arena(), 0, melee({ attack: 2, health: 3 }), 'C4');
    g = placeUnit(g, 1, melee({ attack: 1, health: 5 }), 'C5');
    g = apply(g, { type: 'attack', unitId: id(g, 'C4'), cell: 'C5' });
    expect(hp(g, 'C5')).toBe(3);
    expect(hp(g, 'C4')).toBe(2);
  });

  it('un défenseur tué ne riposte pas et disparaît', () => {
    let g = placeUnit(arena(), 0, melee({ attack: 5, health: 1 }), 'C4');
    g = placeUnit(g, 1, melee({ attack: 3, health: 5 }), 'C5');
    g = apply(g, { type: 'attack', unitId: id(g, 'C4'), cell: 'C5' });
    expect(hp(g, 'C5')).toBeUndefined();
    expect(hp(g, 'C4')).toBe(1);
  });

  it('un tir ne provoque jamais de riposte, même au contact', () => {
    let g = placeUnit(arena(), 0, archer({ attack: 1, health: 1 }), 'C4');
    g = placeUnit(g, 1, archer({ attack: 5, health: 5 }), 'C5');
    g = apply(g, { type: 'attack', unitId: id(g, 'C4'), cell: 'C5' });
    expect(hp(g, 'C5')).toBe(4);
    expect(hp(g, 'C4')).toBe(1);
  });

  it('l\'attaquant meurt s\'il succombe à la riposte', () => {
    let g = placeUnit(arena(), 0, melee({ attack: 1, health: 1 }), 'C4');
    g = placeUnit(g, 1, melee({ attack: 1, health: 5 }), 'C5');
    g = apply(g, { type: 'attack', unitId: id(g, 'C4'), cell: 'C5' });
    expect(hp(g, 'C4')).toBeUndefined();
  });

  it('une seule attaque par unité et par tour, rétablie au tour suivant', () => {
    let g = placeUnit(arena(), 0, melee({ attack: 1 }), 'C4');
    g = placeUnit(g, 1, melee({ attack: 0, health: 9 }), 'C5');
    const u = id(g, 'C4');
    g = apply(g, { type: 'attack', unitId: u, cell: 'C5' });
    expect(() => apply(g, { type: 'attack', unitId: u, cell: 'C5' })).toThrow();
    g = apply(apply(g, { type: 'endTurn' }), { type: 'endTurn' });
    expect(() => apply(g, { type: 'attack', unitId: u, cell: 'C5' })).not.toThrow();
  });

  it('frappe le cristal adverse sans riposte, et gagne à 0 PV', () => {
    let g = placeUnit(arena(), 0, melee({ attack: 4, health: 1 }), 'C6');
    g = { ...g, players: [g.players[0], { ...g.players[1], crystalHp: 4 }] };
    g = apply(g, { type: 'attack', unitId: id(g, 'C6'), cell: 'C7' });
    expect(g.players[1].crystalHp).toBe(0);
    expect(hp(g, 'C6')).toBe(1);
    expect(g.winner).toBe(0);
  });

  it('n\'attaque pas son propre cristal', () => {
    const g = placeUnit(arena(), 0, melee(), 'C3');
    expect(() => apply(g, { type: 'attack', unitId: id(g, 'C3'), cell: 'C2' })).toThrow();
  });
});

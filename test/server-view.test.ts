import { describe, it, expect } from 'vitest';
import { newGame } from '../src/engine.js';
import { playerView } from '../src/server/view.js';
import { deckOf } from './helpers.js';

describe('vue d\'un joueur', () => {
  const g = newGame({ decks: [deckOf(25, 'A'), deckOf(25, 'B')], first: 0 });

  it('montre sa propre main et cache celle de l\'adversaire', () => {
    const v = playerView(g, 0);
    expect(v.you).toBe(0);
    expect(v.players[0].hand?.map(c => c.name)).toEqual(['A0', 'A1', 'A2', 'A3']);
    expect(v.players[1].hand).toBeNull();
    expect(v.players[1].handCount).toBe(5);
  });

  it('ne révèle jamais le contenu des decks, seulement leur taille', () => {
    const v = playerView(g, 1);
    expect(v.players[0].deckCount).toBe(21);
    expect(JSON.stringify(v)).not.toContain('A20');
    expect(JSON.stringify(v)).not.toContain('B20');
  });

  it('expose plateau, cristaux, mana, tour et vainqueur', () => {
    const v = playerView(g, 1);
    expect(v).toMatchObject({ active: 0, turn: 1, winner: null, units: [] });
    expect(v.players[0]).toMatchObject({ crystalHp: 25, crystalCell: 'C2', mana: 2, maxMana: 2 });
    expect(v.players[1].crystalCell).toBe('C7');
  });
});

import { placeUnit } from '../src/engine.js';
import { arena, unitCard } from './helpers.js';
describe('coups possibles dans la vue', () => {
  it('donne au joueur actif ses cases de déploiement et les options de chaque unité', () => {
    let g = placeUnit(arena(0), 0, unitCard('G', { movement: 1 }), 'C4');
    g = placeUnit(g, 1, unitCard('E'), 'C5');
    const v = playerView(g, 0);
    expect(v.options!.deploy.sort()).toEqual(['B1', 'B2', 'B3', 'C1', 'C3', 'D1', 'D2', 'D3']);
    const g0 = v.options!.units.find(u => u.id === g.units[0]!.id)!;
    expect(g0.move.sort()).toEqual(['B4', 'C3', 'D4']);
    expect(g0.attack).toEqual(['C5']);
  });
  it('ne donne aucune option au joueur qui attend', () => {
    expect(playerView(placeUnit(arena(0), 1, unitCard('E'), 'C5'), 1).options).toBeNull();
  });
  it('omet les unités épuisées ou ayant attaqué', () => {
    const g = placeUnit(arena(0), 0, unitCard('G'), 'C4');
    const tired = { ...g, units: g.units.map(u => ({ ...u, attacked: true })) };
    expect(playerView(tired, 0).options!.units).toEqual([]);
  });
});

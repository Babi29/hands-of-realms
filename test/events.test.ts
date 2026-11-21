import { describe, it, expect } from 'vitest';
import { applyWithEvents, newGame, placeUnit, MANA_TOKEN, type PlayerState } from '../src/engine.js';
import { arena, deckOf, unitCard } from './helpers.js';

const unitAt = (g: ReturnType<typeof arena>, cell: string) => g.units.find(u => `${'ABCDE'[u.pos.row]}${u.pos.col + 1}` === cell)!;

describe('événements du moteur', () => {
  it('fin de tour : début du tour adverse puis pioche', () => {
    const { events } = applyWithEvents(newGame({ decks: [deckOf(25, 'A'), deckOf(25, 'B')], first: 0 }), { type: 'endTurn' });
    expect(events).toEqual([
      { type: 'turnStarted', player: 1, turn: 2, mana: 2 },
      { type: 'cardDrawn', player: 1 },
    ]);
  });

  it('main pleine : la carte piochée est brûlée', () => {
    const g0 = arena(0);
    const g = { ...g0, players: [g0.players[0], { ...g0.players[1], hand: deckOf(7, 'H') }] as [PlayerState, PlayerState] };
    const { events } = applyWithEvents(g, { type: 'endTurn' });
    expect(events).toContainEqual({ type: 'cardBurned', player: 1, card: 'B4' });
  });

  it('deck vide : dégâts de fatigue au cristal', () => {
    const g0 = arena(0);
    const g = { ...g0, players: [g0.players[0], { ...g0.players[1], deck: [] }] as [PlayerState, PlayerState] };
    const { events } = applyWithEvents(g, { type: 'endTurn' });
    expect(events).toContainEqual({ type: 'fatigue', player: 1, damage: 1 });
    expect(events).toContainEqual({ type: 'crystalDamaged', player: 1, damage: 1, hp: 24 });
  });

  it('carte Mana', () => {
    const g0 = arena(0);
    const g = { ...g0, players: [{ ...g0.players[0], hand: [MANA_TOKEN] }, g0.players[1]] as [PlayerState, PlayerState] };
    expect(applyWithEvents(g, { type: 'play', handIndex: 0 }).events).toEqual([{ type: 'manaGained', player: 0, amount: 1 }]);
  });

  it('déploiement', () => {
    const g0 = arena(0);
    const g = { ...g0, players: [{ ...g0.players[0], hand: [unitCard('Hoplite')] }, g0.players[1]] as [PlayerState, PlayerState] };
    const { state, events } = applyWithEvents(g, { type: 'play', handIndex: 0, cell: 'B2' });
    expect(events).toEqual([{ type: 'unitDeployed', unitId: state.units[0]!.id, name: 'Hoplite', owner: 0, cell: 'B2' }]);
  });

  it('déplacement avec le chemin case par case', () => {
    const g = placeUnit(arena(0), 0, unitCard('G', { movement: 3 }), 'A1');
    const { events } = applyWithEvents(g, { type: 'move', unitId: unitAt(g, 'A1').id, cell: 'A4' });
    expect(events).toEqual([{ type: 'unitMoved', unitId: unitAt(g, 'A1').id, path: ['A1', 'A2', 'A3', 'A4'] }]);
  });

  it('le chemin contourne un ennemi', () => {
    let g = placeUnit(arena(0), 0, unitCard('G', { movement: 4 }), 'A1');
    g = placeUnit(g, 1, unitCard('E'), 'A2');
    const ev = applyWithEvents(g, { type: 'move', unitId: unitAt(g, 'A1').id, cell: 'A3' }).events[0] as { path: string[] };
    expect(ev.path).toEqual(['A1', 'B1', 'B2', 'B3', 'A3']);
  });

  it('attaque de mêlée avec riposte puis mort de l\'attaquant', () => {
    let g = placeUnit(arena(0), 0, unitCard('G', { attack: 2, health: 1 }), 'C4');
    g = placeUnit(g, 1, unitCard('E', { attack: 3, health: 5 }), 'C5');
    const a = unitAt(g, 'C4').id, d = unitAt(g, 'C5').id;
    expect(applyWithEvents(g, { type: 'attack', unitId: a, cell: 'C5' }).events).toEqual([
      { type: 'attacked', unitId: a, target: { kind: 'unit', unitId: d }, damage: 2, ranged: false },
      { type: 'retaliated', unitId: d, targetUnitId: a, damage: 3 },
      { type: 'unitDied', unitId: a, cell: 'C4' },
    ]);
  });

  it('tir mortel : pas de riposte, mort du défenseur', () => {
    let g = placeUnit(arena(0), 0, unitCard('Archer', { attackRange: 'ranged', attack: 5 }), 'C3');
    g = placeUnit(g, 1, unitCard('E', { health: 2 }), 'C5');
    const a = unitAt(g, 'C3').id, d = unitAt(g, 'C5').id;
    expect(applyWithEvents(g, { type: 'attack', unitId: a, cell: 'C5' }).events).toEqual([
      { type: 'attacked', unitId: a, target: { kind: 'unit', unitId: d }, damage: 5, ranged: true },
      { type: 'unitDied', unitId: d, cell: 'C5' },
    ]);
  });

  it('coup fatal au cristal : dégâts puis victoire', () => {
    let g = placeUnit(arena(0), 0, unitCard('G', { attack: 9 }), 'C6');
    g = { ...g, players: [g.players[0], { ...g.players[1], crystalHp: 3 }] };
    const a = unitAt(g, 'C6').id;
    expect(applyWithEvents(g, { type: 'attack', unitId: a, cell: 'C7' }).events).toEqual([
      { type: 'attacked', unitId: a, target: { kind: 'crystal', player: 1 }, damage: 9, ranged: false },
      { type: 'crystalDamaged', player: 1, damage: 9, hp: 0 },
      { type: 'gameWon', winner: 0 },
    ]);
  });
});

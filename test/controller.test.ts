import { describe, it, expect } from 'vitest';
import { placeUnit, MANA_TOKEN, type PlayerState } from '../src/engine.js';
import { initUI, click, highlights, type UIState } from '../src/ui/controller.js';
import { arena, unitCard } from './helpers.js';

const ui = (g = arena(0)): UIState => initUI(g);
const unitAt = (s: UIState, cell: string) => s.game.units.find(u => `${'ABCDE'[u.pos.row]}${u.pos.col + 1}` === cell);

describe('contrôleur', () => {
  it('sélectionne une carte de la main puis la déploie sur une case surlignée', () => {
    const g0 = arena(0);
    let s = ui({ ...g0, players: [{ ...g0.players[0], hand: [unitCard('Hoplite', { mana: 2 })] }, g0.players[1]] });
    s = click(s, { kind: 'hand', index: 0 });
    expect(s.selected).toEqual({ kind: 'hand', index: 0 });
    expect(highlights(s).deploy.sort()).toEqual(['B1', 'B2', 'B3', 'C1', 'C3', 'D1', 'D2', 'D3']);
    s = click(s, { kind: 'cell', cell: 'B2' });
    expect(unitAt(s, 'B2')?.name).toBe('Hoplite');
    expect(s.selected).toBeNull();
    expect(s.error).toBeNull();
  });

  it('joue la carte Mana dès le clic', () => {
    const g0 = arena(0);
    let s = ui({ ...g0, players: [{ ...g0.players[0], hand: [MANA_TOKEN], mana: 2 }, g0.players[1]] });
    s = click(s, { kind: 'hand', index: 0 });
    expect(s.game.players[0].mana).toBe(3);
    expect(s.selected).toBeNull();
  });

  it('signale une carte trop chère sans planter', () => {
    const g0 = arena(0);
    const s = click(ui({ ...g0, players: [{ ...g0.players[0], hand: [unitCard('Titan', { mana: 11 })] }, g0.players[1]] }), { kind: 'hand', index: 0 });
    expect(s.selected).toBeNull();
    expect(s.error).toMatch(/mana/);
  });

  it('sélectionne une unité, surligne déplacements et cibles, puis déplace et attaque', () => {
    let g = placeUnit(arena(0), 0, unitCard('G', { movement: 1, attack: 1 }), 'C4');
    g = placeUnit(g, 1, unitCard('E', { health: 9, attack: 0 }), 'C6');
    let s = click(ui(g), { kind: 'cell', cell: 'C4' });
    expect(highlights(s).move).toContain('C5');
    expect(highlights(s).attack).toEqual([]);
    s = click(s, { kind: 'cell', cell: 'C5' });
    expect(unitAt(s, 'C5')?.name).toBe('G');
    expect(s.selected).toEqual({ kind: 'unit', id: unitAt(s, 'C5')!.id });
    expect(highlights(s).attack).toEqual(['C6']);
    s = click(s, { kind: 'cell', cell: 'C6' });
    expect(unitAt(s, 'C6')?.health).toBe(8);
    expect(s.selected).toBeNull();
  });

  it('ne sélectionne pas une unité adverse ni épuisée', () => {
    const g = placeUnit(arena(0), 1, unitCard('E'), 'C5');
    expect(click(ui(g), { kind: 'cell', cell: 'C5' }).selected).toBeNull();
  });

  it('désélectionne en cliquant une case sans action', () => {
    const g = placeUnit(arena(0), 0, unitCard('G', { movement: 1 }), 'C4');
    let s = click(ui(g), { kind: 'cell', cell: 'C4' });
    s = click(s, { kind: 'cell', cell: 'A8' });
    expect(s.selected).toBeNull();
  });

  it('fin de tour : passe la main et vide la sélection', () => {
    const g = placeUnit(arena(0), 0, unitCard('G'), 'C4');
    let s = click(ui(g), { kind: 'cell', cell: 'C4' });
    s = click(s, { kind: 'endTurn' });
    expect(s.game.active).toBe(1);
    expect(s.selected).toBeNull();
  });

  it('garde un journal des actions', () => {
    let g = placeUnit(arena(0), 0, unitCard('G', { attack: 3 }), 'C6');
    let s = click(click(ui(g), { kind: 'cell', cell: 'C6' }), { kind: 'cell', cell: 'C7' });
    expect(s.log.at(-1)).toMatch(/G.*cristal/);
    expect(s.game.players[1].crystalHp).toBe(22);
  });
});

import { hasAnyAction } from '../src/ui/controller.js';
describe('aide quand rien n\'est jouable', () => {
  it('faux si aucune carte abordable et aucune unité prête', () => {
    const g0 = arena(0);
    const g = { ...g0, players: [{ ...g0.players[0], hand: [unitCard('Titan', { mana: 4 })], mana: 2 }, g0.players[1]] as [PlayerState, PlayerState] };
    expect(hasAnyAction(ui(g))).toBe(false);
  });
  it('vrai si une carte est abordable', () => {
    const g0 = arena(0);
    expect(hasAnyAction(ui({ ...g0, players: [{ ...g0.players[0], hand: [unitCard('a', { mana: 2 })], mana: 2 }, g0.players[1]] as [PlayerState, PlayerState] }))).toBe(true);
  });
  it('vrai si une unité peut encore bouger ou attaquer', () => {
    expect(hasAnyAction(ui(placeUnit(arena(0), 0, unitCard('G'), 'C4')))).toBe(true);
  });
});

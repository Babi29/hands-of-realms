import { COLS, ROWS, formatCell, isOnBoard, parseCell, type Pos } from './board.js';
import type { Card } from './cards.js';

export type PlayerId = 0 | 1;
export const CRYSTAL_HP = 25;
export const CRYSTAL_CELLS: Record<PlayerId, string> = { 0: 'C2', 1: 'C7' };
export const MAX_HAND = 7;
export const MAX_MANA = 10;
export const RANGED_REACH = 3;
export const MANA_TOKEN: Card = {
  name: 'Mana', type: 'Item', pantheon: 'Neutral', rarity: 'Free', mana: 0,
  attack: null, health: null, movement: null, attackRange: null, text: 'Gagne 1 mana pour ce tour.',
};

export interface Unit {
  id: number;
  name: string;
  owner: PlayerId;
  pos: Pos;
  attack: number;
  health: number;
  maxHealth: number;
  movement: number;
  attackRange: 'melee' | 'ranged';
  exhausted: boolean;
  moved: boolean;
  attacked: boolean;
}

export interface PlayerState {
  crystal: Pos;
  crystalHp: number;
  deck: Card[];
  hand: Card[];
  mana: number;
  maxMana: number;
  fatigue: number;
}

export interface GameState {
  readonly players: readonly [PlayerState, PlayerState];
  readonly units: readonly Unit[];
  readonly active: PlayerId;
  readonly turn: number;
  readonly winner: PlayerId | null;
  readonly nextId: number;
}

export type Action =
  | { type: 'endTurn' }
  | { type: 'play'; handIndex: number; cell?: string }
  | { type: 'move'; unitId: number; cell: string }
  | { type: 'attack'; unitId: number; cell: string };

export type UnitTarget = { kind: 'unit'; unitId: number } | { kind: 'crystal'; player: PlayerId };
export type GameEvent =
  | { type: 'turnStarted'; player: PlayerId; turn: number; mana: number }
  | { type: 'cardDrawn'; player: PlayerId }
  | { type: 'cardBurned'; player: PlayerId; card: string }
  | { type: 'fatigue'; player: PlayerId; damage: number }
  | { type: 'manaGained'; player: PlayerId; amount: number }
  | { type: 'unitDeployed'; unitId: number; name: string; owner: PlayerId; cell: string }
  | { type: 'unitMoved'; unitId: number; path: string[] }
  | { type: 'attacked'; unitId: number; target: UnitTarget; damage: number; ranged: boolean }
  | { type: 'retaliated'; unitId: number; targetUnitId: number; damage: number }
  | { type: 'unitDied'; unitId: number; cell: string }
  | { type: 'crystalDamaged'; player: PlayerId; damage: number; hp: number }
  | { type: 'gameWon'; winner: PlayerId };

const other = (p: PlayerId): PlayerId => (1 - p) as PlayerId;
const same = (a: Pos, b: Pos) => a.row === b.row && a.col === b.col;
const manhattan = (a: Pos, b: Pos) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
const chebyshev = (a: Pos, b: Pos) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));

function setPlayer(g: GameState, p: PlayerId, patch: Partial<PlayerState>): GameState {
  const players = [...g.players] as [PlayerState, PlayerState];
  players[p] = { ...players[p], ...patch };
  return { ...g, players };
}

function damageCrystal(g: GameState, p: PlayerId, amount: number, ev: GameEvent[] = []): GameState {
  const hp = Math.max(0, g.players[p].crystalHp - amount);
  const next = setPlayer(g, p, { crystalHp: hp });
  ev.push({ type: 'crystalDamaged', player: p, damage: amount, hp });
  if (hp === 0 && g.winner === null) {
    ev.push({ type: 'gameWon', winner: other(p) });
    return { ...next, winner: other(p) };
  }
  return next;
}

function draw(g: GameState, p: PlayerId, ev: GameEvent[] = []): GameState {
  const pl = g.players[p];
  if (pl.deck.length === 0) {
    const fatigue = pl.fatigue + 1;
    ev.push({ type: 'fatigue', player: p, damage: fatigue });
    return damageCrystal(setPlayer(g, p, { fatigue }), p, fatigue, ev);
  }
  const [card, ...deck] = pl.deck;
  if (pl.hand.length >= MAX_HAND) {
    ev.push({ type: 'cardBurned', player: p, card: card!.name }); // main pleine : carte défaussée
    return setPlayer(g, p, { deck });
  }
  ev.push({ type: 'cardDrawn', player: p });
  return setPlayer(g, p, { deck, hand: [...pl.hand, card!] });
}

function startTurn(g: GameState, p: PlayerId, ev: GameEvent[] = []): GameState {
  const maxMana = Math.min(MAX_MANA, g.players[p].maxMana + 1);
  let next = setPlayer({ ...g, active: p }, p, { maxMana, mana: maxMana });
  next = { ...next, units: next.units.map(u => (u.owner === p ? { ...u, exhausted: false, moved: false, attacked: false } : u)) };
  ev.push({ type: 'turnStarted', player: p, turn: next.turn, mana: maxMana });
  return draw(next, p, ev);
}

export function newGame(opts: { decks: [Card[], Card[]]; first: PlayerId }): GameState {
  const second = other(opts.first);
  const mk = (p: PlayerId): PlayerState => ({
    crystal: parseCell(CRYSTAL_CELLS[p]), crystalHp: CRYSTAL_HP,
    deck: [...opts.decks[p]], hand: [], mana: 0, maxMana: 1, fatigue: 0,
  });
  let g: GameState = { players: [mk(0), mk(1)], units: [], active: opts.first, turn: 1, winner: null, nextId: 1 };
  for (let i = 0; i < 3; i++) g = draw(g, opts.first);
  for (let i = 0; i < 4; i++) g = draw(g, second);
  g = setPlayer(g, second, { hand: [...g.players[second].hand, MANA_TOKEN] });
  return startTurn(g, opts.first);
}

/** Pose directement une unité prête à agir (scénarios et tests). */
export function placeUnit(g: GameState, owner: PlayerId, card: Card, cell: string): GameState {
  const pos = parseCell(cell);
  if (isOccupied(g, pos)) throw new Error(`Case occupée : ${cell}`);
  return { ...g, units: [...g.units, makeUnit(g.nextId, owner, card, pos, false)], nextId: g.nextId + 1 };
}

function makeUnit(id: number, owner: PlayerId, card: Card, pos: Pos, exhausted: boolean): Unit {
  if (card.attack === null || card.health === null) throw new Error(`${card.name} n'est pas une unité`);
  return {
    id, name: card.name, owner, pos,
    attack: card.attack, health: card.health, maxHealth: card.health,
    movement: card.movement ?? 0, attackRange: card.attackRange ?? 'melee',
    exhausted, moved: false, attacked: false,
  };
}

const unitAt = (g: GameState, pos: Pos) => g.units.find(u => same(u.pos, pos));
const crystalOwnerAt = (g: GameState, pos: Pos): PlayerId | undefined =>
  same(g.players[0].crystal, pos) ? 0 : same(g.players[1].crystal, pos) ? 1 : undefined;
const isOccupied = (g: GameState, pos: Pos) => unitAt(g, pos) !== undefined || crystalOwnerAt(g, pos) !== undefined;

function ownReadyUnit(g: GameState, unitId: number): Unit {
  const u = g.units.find(x => x.id === unitId);
  if (!u) throw new Error(`Unité inconnue : ${unitId}`);
  if (u.owner !== g.active) throw new Error(`${u.name} n'appartient pas au joueur actif`);
  if (u.exhausted) throw new Error(`${u.name} est épuisée`);
  return u;
}

export function deployCells(g: GameState): string[] {
  const c = g.players[g.active].crystal;
  const out: string[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const p = { row: c.row + dr, col: c.col + dc };
      if ((dr || dc) && isOnBoard(p) && !isOccupied(g, p)) out.push(formatCell(p));
    }
  return out;
}

export function reachableCells(g: GameState, unitId: number): string[] {
  return [...reachablePaths(g, unitId).keys()];
}

/** Cases d'arrivée possibles, chacune avec le chemin le plus court (case de départ incluse). */
function reachablePaths(g: GameState, unitId: number): Map<string, string[]> {
  const u = g.units.find(x => x.id === unitId);
  const result = new Map<string, string[]>();
  if (!u) return result;
  const seen = new Set([`${u.pos.row},${u.pos.col}`]);
  const paths = new Map<string, string[]>([[`${u.pos.row},${u.pos.col}`, [formatCell(u.pos)]]]);
  let frontier = [u.pos];
  for (let step = 0; step < u.movement; step++) {
    const next: Pos[] = [];
    for (const p of frontier) {
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const q = { row: p.row + dr, col: p.col + dc };
        const key = `${q.row},${q.col}`;
        if (!isOnBoard(q) || seen.has(key)) continue;
        seen.add(key);
        if (crystalOwnerAt(g, q) !== undefined) continue;
        const occ = unitAt(g, q);
        if (occ && occ.owner !== u.owner) continue; // ennemi : bloque
        const path = [...paths.get(`${p.row},${p.col}`)!, formatCell(q)];
        paths.set(key, path);
        next.push(q); // allié : traversable
        if (!occ) result.set(formatCell(q), path);
      }
    }
    frontier = next;
  }
  return result;
}

export function attackableCells(g: GameState, unitId: number): string[] {
  const u = g.units.find(x => x.id === unitId);
  if (!u) return [];
  const inRange = (p: Pos) => (u.attackRange === 'ranged' ? manhattan(u.pos, p) <= RANGED_REACH : chebyshev(u.pos, p) === 1);
  const out: string[] = [];
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++) {
      const p = { row, col };
      if (same(p, u.pos) || !inRange(p)) continue;
      const target = unitAt(g, p);
      if ((target && target.owner !== u.owner) || crystalOwnerAt(g, p) === other(u.owner)) out.push(formatCell(p));
    }
  return out;
}

function hitUnit(g: GameState, id: number, amount: number, ev: GameEvent[]): GameState {
  const u = g.units.find(x => x.id === id)!;
  if (u.health - amount <= 0) {
    ev.push({ type: 'unitDied', unitId: id, cell: formatCell(u.pos) });
    return { ...g, units: g.units.filter(x => x.id !== id) };
  }
  return { ...g, units: g.units.map(x => (x.id === id ? { ...x, health: x.health - amount } : x)) };
}

export function apply(g: GameState, a: Action): GameState {
  return applyWithEvents(g, a).state;
}

/** Applique une action et renvoie aussi la suite d'événements, dans l'ordre, pour l'animation. */
export function applyWithEvents(g: GameState, a: Action): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  return { state: step(g, a, events), events };
}

function step(g: GameState, a: Action, ev: GameEvent[]): GameState {
  if (g.winner !== null) throw new Error('La partie est terminée');
  const me = g.active;
  switch (a.type) {
    case 'endTurn':
      return startTurn({ ...g, turn: g.turn + 1 }, other(me), ev);

    case 'play': {
      const pl = g.players[me];
      const card = pl.hand[a.handIndex];
      if (!card) throw new Error(`Pas de carte en position ${a.handIndex}`);
      const cost = card.mana ?? 0;
      if (cost > pl.mana) throw new Error(`Pas assez de mana (${pl.mana}/${cost})`);
      const hand = pl.hand.filter((_, i) => i !== a.handIndex);
      if (card.name === MANA_TOKEN.name && card.type === 'Item') {
        ev.push({ type: 'manaGained', player: me, amount: 1 });
        return setPlayer(g, me, { hand, mana: pl.mana - cost + 1 });
      }
      if (card.type === 'Item' || card.type === 'Leader') throw new Error(`Type de carte pas encore géré : ${card.type}`);
      if (!a.cell) throw new Error('Case de déploiement manquante');
      const pos = parseCell(a.cell);
      if (isOccupied(g, pos)) throw new Error(`Case occupée : ${a.cell}`);
      if (chebyshev(pos, pl.crystal) !== 1) throw new Error(`${a.cell} n'est pas autour de votre cristal`);
      const next = setPlayer(g, me, { hand, mana: pl.mana - cost });
      ev.push({ type: 'unitDeployed', unitId: g.nextId, name: card.name, owner: me, cell: a.cell });
      return { ...next, units: [...next.units, makeUnit(g.nextId, me, card, pos, true)], nextId: g.nextId + 1 };
    }

    case 'move': {
      const u = ownReadyUnit(g, a.unitId);
      if (u.moved || u.attacked) throw new Error(`${u.name} ne peut plus se déplacer ce tour`);
      const path = reachablePaths(g, u.id).get(a.cell);
      if (!path) throw new Error(`${u.name} ne peut pas atteindre ${a.cell}`);
      ev.push({ type: 'unitMoved', unitId: u.id, path });
      const pos = parseCell(a.cell);
      return { ...g, units: g.units.map(x => (x.id === u.id ? { ...x, pos, moved: true } : x)) };
    }

    case 'attack': {
      const u = ownReadyUnit(g, a.unitId);
      if (u.attacked) throw new Error(`${u.name} a déjà attaqué ce tour`);
      if (!attackableCells(g, u.id).includes(a.cell)) throw new Error(`${u.name} ne peut pas attaquer ${a.cell}`);
      const pos = parseCell(a.cell);
      let next: GameState = { ...g, units: g.units.map(x => (x.id === u.id ? { ...x, attacked: true } : x)) };
      const target = unitAt(g, pos);
      const ranged = u.attackRange === 'ranged';
      if (!target) {
        ev.push({ type: 'attacked', unitId: u.id, target: { kind: 'crystal', player: other(me) }, damage: u.attack, ranged });
        return damageCrystal(next, other(me), u.attack, ev);
      }
      ev.push({ type: 'attacked', unitId: u.id, target: { kind: 'unit', unitId: target.id }, damage: u.attack, ranged });
      next = hitUnit(next, target.id, u.attack, ev);
      const survivor = next.units.find(x => x.id === target.id);
      if (survivor && !ranged) {
        ev.push({ type: 'retaliated', unitId: survivor.id, targetUnitId: u.id, damage: survivor.attack });
        next = hitUnit(next, u.id, survivor.attack, ev);
      }
      return next;
    }
  }
}

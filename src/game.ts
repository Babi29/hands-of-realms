import { parseCell, type Pos } from './board.js';

export type PlayerId = 0 | 1;
export const CRYSTAL_HP = 25;
export const CRYSTAL_CELLS: Record<PlayerId, string> = { 0: 'C2', 1: 'C7' };

export interface PlayerState { crystal: Pos; crystalHp: number }
export interface GameState {
  readonly players: readonly [PlayerState, PlayerState];
  readonly winner: PlayerId | null;
}

export function newGame(): GameState {
  return {
    players: [
      { crystal: parseCell(CRYSTAL_CELLS[0]), crystalHp: CRYSTAL_HP },
      { crystal: parseCell(CRYSTAL_CELLS[1]), crystalHp: CRYSTAL_HP },
    ],
    winner: null,
  };
}

export function crystalAt(g: GameState, cell: string): { owner: PlayerId; hp: number } | undefined {
  const p = parseCell(cell);
  const owner = g.players.findIndex(pl => pl.crystal.row === p.row && pl.crystal.col === p.col);
  return owner === -1 ? undefined : { owner: owner as PlayerId, hp: g.players[owner]!.crystalHp };
}

export function damageCrystal(g: GameState, target: PlayerId, amount: number): GameState {
  if (!Number.isInteger(amount) || amount < 0) throw new Error(`Dégâts invalides : ${amount}`);
  const players = g.players.map((pl, i) =>
    i === target ? { ...pl, crystalHp: Math.max(0, pl.crystalHp - amount) } : pl,
  ) as unknown as [PlayerState, PlayerState];
  const winner = g.winner ?? (players[target].crystalHp === 0 ? ((1 - target) as PlayerId) : null);
  return { players, winner };
}

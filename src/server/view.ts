import { formatCell } from '../board.js';
import type { Card } from '../cards.js';
import { attackableCells, deployCells, reachableCells, type GameState, type PlayerId } from '../engine.js';

export interface PlayerPublic {
  crystalCell: string;
  crystalHp: number;
  mana: number;
  maxMana: number;
  handCount: number;
  deckCount: number;
  /** Visible seulement pour son propriétaire. */
  hand: Card[] | null;
}

export interface UnitView {
  id: number; name: string; owner: PlayerId; cell: string;
  attack: number; health: number; maxHealth: number; movement: number;
  attackRange: 'melee' | 'ranged'; exhausted: boolean; moved: boolean; attacked: boolean;
}

export interface PlayerView {
  you: PlayerId;
  active: PlayerId;
  turn: number;
  winner: PlayerId | null;
  players: [PlayerPublic, PlayerPublic];
  units: UnitView[];
  /** Coups possibles, calculés par le serveur, pour le joueur actif uniquement. */
  options: { deploy: string[]; units: { id: number; move: string[]; attack: string[] }[] } | null;
  names?: [string, string];
  pantheons?: [string, string];
}

/** État vu par un joueur : sa main en clair, rien du deck ni de la main adverse. */
export function playerView(g: GameState, you: PlayerId): PlayerView {
  const pub = (p: PlayerId): PlayerPublic => {
    const pl = g.players[p];
    return {
      crystalCell: formatCell(pl.crystal), crystalHp: pl.crystalHp, mana: pl.mana, maxMana: pl.maxMana,
      handCount: pl.hand.length, deckCount: pl.deck.length, hand: p === you ? [...pl.hand] : null,
    };
  };
  return {
    you, active: g.active, turn: g.turn, winner: g.winner,
    players: [pub(0), pub(1)],
    options: you !== g.active || g.winner !== null ? null : {
      deploy: deployCells(g),
      units: g.units
        .filter(u => u.owner === you && !u.exhausted && !u.attacked)
        .map(u => ({ id: u.id, move: u.moved ? [] : reachableCells(g, u.id), attack: attackableCells(g, u.id) })),
    },
    units: g.units.map(u => ({
      id: u.id, name: u.name, owner: u.owner, cell: formatCell(u.pos), attack: u.attack, health: u.health,
      maxHealth: u.maxHealth, movement: u.movement, attackRange: u.attackRange,
      exhausted: u.exhausted, moved: u.moved, attacked: u.attacked,
    })),
  };
}

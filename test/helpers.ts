import type { Card } from '../src/cards.js';
import { newGame, type GameState, type PlayerId } from '../src/engine.js';

export function unitCard(name: string, o: Partial<Card> = {}): Card {
  return { name, type: 'Minion', pantheon: 'Neutral', rarity: 'Common', mana: 1, attack: 2, health: 3, movement: 2, attackRange: 'melee', text: '', ...o };
}

export function deckOf(n: number, prefix = 'C'): Card[] {
  return Array.from({ length: n }, (_, i) => unitCard(`${prefix}${i}`));
}

/** Partie vide au tour du joueur `active`, mains vides, 10 mana, sans unités. */
export function arena(active: PlayerId = 0): GameState {
  const g = newGame({ decks: [deckOf(20, 'A'), deckOf(20, 'B')], first: 0 });
  return {
    ...g,
    active,
    players: [
      { ...g.players[0], hand: [], mana: 10, maxMana: 10 },
      { ...g.players[1], hand: [], mana: 10, maxMana: 10 },
    ],
  };
}

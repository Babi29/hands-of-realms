import { readFileSync } from 'node:fs';

export const CARD_TYPES = ['Leader', 'God', 'Minion', 'Beast', 'Structure', 'Item'] as const;
export type CardType = (typeof CARD_TYPES)[number];

export interface Card {
  name: string;
  type: CardType;
  pantheon: string | null;
  rarity: string | null;
  mana: number | null;
  attack: number | null;
  health: number | null;
  movement: number | null;
  attackRange: 'melee' | 'ranged' | null;
  text: string;
}

export function loadCards(path = new URL('../data/hotg-cards.json', import.meta.url)): Card[] {
  return JSON.parse(readFileSync(path, 'utf8')) as Card[];
}

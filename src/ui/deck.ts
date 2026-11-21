import type { Card } from '../cards.js';

const UNIT_TYPES = ['God', 'Minion', 'Beast', 'Structure'];
const playable = (c: Card) => UNIT_TYPES.includes(c.type) && c.mana !== null && c.attack !== null && c.health !== null;

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(xs: readonly T[], rng: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function playablePantheons(cards: readonly Card[]): string[] {
  return [...new Set(cards.filter(c => playable(c) && c.pantheon && c.pantheon !== 'Neutral').map(c => c.pantheon!))].sort();
}

/** Deck de test : unités seulement (les objets ne sont pas encore gérés par le moteur). */
export function buildDeck(cards: readonly Card[], pantheon: string, rng: () => number, size = 25): Card[] {
  const copies = (c: Card) => (c.rarity === 'Legendary' ? 1 : 2);
  const own = shuffle(cards.filter(c => playable(c) && c.pantheon === pantheon), rng).flatMap(c => Array(copies(c)).fill(c) as Card[]);
  const neutral = shuffle(cards.filter(c => playable(c) && c.pantheon === 'Neutral'), rng).flatMap(c => Array(copies(c)).fill(c) as Card[]);
  const ownPart = own.slice(0, Math.min(own.length, 15));
  return shuffle([...ownPart, ...neutral.slice(0, size - ownPart.length)], rng);
}

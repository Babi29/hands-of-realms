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

const CURVE: { max: number; n: number }[] = [
  { max: 2, n: 9 },
  { max: 3, n: 6 },
  { max: 4, n: 5 },
  { max: 99, n: 5 },
];

/**
 * Deck de test : unités seulement (les objets ne sont pas encore gérés par le moteur).
 * Suit une courbe de mana (9 cartes à 2 ou moins, 6 à 3, 5 à 4, 5 au-delà), en puisant d'abord
 * dans le panthéon (au moins 8 cartes), puis dans les neutres.
 */
export function buildDeck(cards: readonly Card[], pantheon: string, rng: () => number, size = 25): Card[] {
  const copies = (c: Card) => (c.rarity === 'Legendary' ? 1 : 2);
  const pool = (p: string) => shuffle(cards.filter(c => playable(c) && c.pantheon === p), rng).flatMap(c => Array(copies(c)).fill(c) as Card[]);
  const own = pool(pantheon);
  const neutral = pool('Neutral');
  const deck: Card[] = [];
  const take = (from: Card[], pred: (c: Card) => boolean, n: number) => {
    for (let i = 0; i < from.length && n > 0; ) {
      if (pred(from[i]!)) { deck.push(from.splice(i, 1)[0]!); n--; } else i++;
    }
    return n;
  };
  let min = -1;
  for (const b of CURVE) {
    const inBucket = (c: Card) => (c.mana ?? 0) > min && (c.mana ?? 0) <= b.max;
    const left = take(own, inBucket, Math.ceil(b.n / 2));
    take(neutral, inBucket, b.n - Math.ceil(b.n / 2) + left);
    min = b.max;
  }
  const ownCount = () => deck.filter(c => c.pantheon === pantheon).length;
  while (ownCount() < 8 && own.length) {
    const j = deck.findIndex(c => c.pantheon === 'Neutral' && (c.mana ?? 0) > 2);
    if (j < 0) break;
    deck.splice(j, 1, own.shift()!);
  }
  take(own, () => true, size - deck.length);
  take(neutral, () => true, size - deck.length);
  return shuffle(deck.slice(0, size), rng);
}

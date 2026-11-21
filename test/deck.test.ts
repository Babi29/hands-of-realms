import { describe, it, expect } from 'vitest';
import { loadCards } from '../src/cards.js';
import { buildDeck, playablePantheons, mulberry32 } from '../src/ui/deck.js';

const cards = loadCards();

describe('construction de decks de test', () => {
  it('ne propose que les panthéons qui ont des unités jouables', () => {
    const p = playablePantheons(cards);
    expect(p).toEqual(expect.arrayContaining(['Greek', 'Egyptian', 'Norse', 'Roman', 'Chinese', 'Mayan']));
    expect(p).not.toContain('Hindu');
    expect(p).not.toContain('Neutral');
  });

  it('construit 25 cartes du panthéon ou neutres, uniquement des unités', () => {
    const d = buildDeck(cards, 'Greek', mulberry32(1));
    expect(d).toHaveLength(25);
    for (const c of d) {
      expect(['Greek', 'Neutral']).toContain(c.pantheon);
      expect(['God', 'Minion', 'Beast', 'Structure']).toContain(c.type);
      expect(c.mana).not.toBeNull();
    }
  });

  it('respecte 2 exemplaires maximum, 1 pour une légendaire', () => {
    const d = buildDeck(cards, 'Norse', mulberry32(7));
    const n = new Map<string, number>();
    for (const c of d) n.set(c.name, (n.get(c.name) ?? 0) + 1);
    for (const c of d) expect(n.get(c.name)!, c.name).toBeLessThanOrEqual(c.rarity === 'Legendary' ? 1 : 2);
  });

  it('inclut au moins 8 cartes du panthéon choisi', () => {
    const d = buildDeck(cards, 'Mayan', mulberry32(3));
    expect(d.filter(c => c.pantheon === 'Mayan').length).toBeGreaterThanOrEqual(8);
  });

  it('est déterministe pour une même graine', () => {
    expect(buildDeck(cards, 'Greek', mulberry32(42)).map(c => c.name))
      .toEqual(buildDeck(cards, 'Greek', mulberry32(42)).map(c => c.name));
  });
});

describe('courbe de mana des decks de test', () => {
  for (const p of ['Greek', 'Egyptian', 'Norse', 'Roman', 'Chinese', 'Mayan'])
    it(`${p} : au moins 8 cartes à 2 mana ou moins, et 8 cartes du panthéon`, () => {
      const d = buildDeck(cards, p, mulberry32(11));
      expect(d).toHaveLength(25);
      expect(d.filter(c => (c.mana ?? 0) <= 2).length).toBeGreaterThanOrEqual(8);
      expect(d.filter(c => c.pantheon === p).length).toBeGreaterThanOrEqual(8);
    });
});

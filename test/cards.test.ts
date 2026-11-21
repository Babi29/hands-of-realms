import { describe, it, expect } from 'vitest';
import { loadCards, CARD_TYPES } from '../src/cards.js';

const cards = loadCards();

describe('base de cartes Hand of the Gods', () => {
  it('contient au moins 185 cartes aux noms uniques', () => {
    expect(cards.length).toBeGreaterThanOrEqual(185);
    expect(new Set(cards.map(c => c.name)).size).toBe(cards.length);
  });

  it('n\'utilise que des types connus', () => {
    for (const c of cards) expect(CARD_TYPES).toContain(c.type);
  });

  it('donne attaque, PV et déplacement à toute unité non-leader', () => {
    const units = cards.filter(c => ['God', 'Minion', 'Beast', 'Structure'].includes(c.type));
    expect(units.length).toBeGreaterThan(100);
    for (const c of units) {
      expect(c.attack, c.name).not.toBeNull();
      expect(c.health, c.name).not.toBeNull();
      expect(c.movement, c.name).not.toBeNull();
    }
  });

  it('a un coût en mana pour chaque carte jouable', () => {
    for (const c of cards.filter(c => c.type !== 'Leader')) expect(c.mana, c.name).not.toBeNull();
  });

  it('a un leader par panthéon majeur', () => {
    const leaders = new Set(cards.filter(c => c.type === 'Leader').map(c => c.pantheon));
    for (const p of ['Greek', 'Egyptian', 'Norse', 'Chinese', 'Mayan', 'Roman', 'Hindu']) expect(leaders, p).toContain(p);
  });

  it('exclut les skins de leader (purement cosmétiques)', () => {
    expect(cards.filter(c => c.type === 'Leader' && c.name.includes(' - '))).toEqual([]);
  });

  it('conserve des valeurs exactes connues', () => {
    expect(cards.find(c => c.name === 'Ah Muzen Cab')).toMatchObject({ type: 'God', pantheon: 'Mayan', mana: 5, attack: 5, health: 3, movement: 2, attackRange: 'ranged' });
  });
});

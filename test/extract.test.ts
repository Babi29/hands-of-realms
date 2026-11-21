import { describe, it, expect } from 'vitest';
import { parseCardPage } from '../scripts/extract-cards.js';

const infobox = `{{Infobox
|name=Accensus
|image=
|type=Minion
|pantheon=Neutral
|rarity=Common
|description=If adjacent to a friendly unit, attacks hit all adjacent enemies.
|damage=2
|health=4
|movement=3
|mana=3
}}

'''Accensus''' ... Accensus is a Melee unit that deals 2 damage and has 4 health.`;

const item = `{{Infobox
|name=Annihilation
|type=Item
|pantheon=Egyptian
|rarity=Legendary
|description=Deal 3 Damage to all Enemies
|mana=7
}}`;

const cardsTemplate = `{{Cards
|name=Ganesha
|pantheon=Hindu
|type=Unit
|rarity=Free
|mana=
|attack=
|health=
|description=Summon a Pillar of Life.
|unit type=Leader
}}
His special ability allow the player to spend 2 mana to Summon a Pillar.`;

const proseLeader = `Bellona is the Leader of the Roman Pantheon.

Details:

Card type: Leader

Pantheon: Roman

Description: Spend 2 mana to move a unit up to 2 Tiles away.`;

describe('parseCardPage', () => {
  it('lit une unité depuis une Infobox, avec sa portée', () => {
    expect(parseCardPage('Accensus', infobox)).toEqual({
      name: 'Accensus', type: 'Minion', pantheon: 'Neutral', rarity: 'Common',
      mana: 3, attack: 2, health: 4, movement: 3, attackRange: 'melee',
      text: 'If adjacent to a friendly unit, attacks hit all adjacent enemies.',
    });
  });

  it('lit un objet sans stats de combat', () => {
    const c = parseCardPage('Annihilation', item)!;
    expect(c).toMatchObject({ type: 'Item', mana: 7, attack: null, health: null, movement: null, attackRange: null });
  });

  it('lit le modèle {{Cards}} et classe un leader comme Leader', () => {
    expect(parseCardPage('Ganesha', cardsTemplate)).toMatchObject({
      name: 'Ganesha', type: 'Leader', pantheon: 'Hindu', rarity: 'Free', mana: null,
    });
  });

  it('lit un leader décrit en prose', () => {
    expect(parseCardPage('Bellona', proseLeader)).toMatchObject({
      name: 'Bellona', type: 'Leader', pantheon: 'Roman',
      text: 'Spend 2 mana to move a unit up to 2 Tiles away.',
    });
  });

  it('nettoie le wikitexte de la description', () => {
    const c = parseCardPage('X', `{{Infobox\n|name=X\n|type=God\n|pantheon=Mayan\n|description='''Warcry''': Deploy two [[Hives]].\n|mana=5\n}}`)!;
    expect(c.text).toBe('Warcry: Deploy two Hives.');
  });

  it('lit un leader décrit en une phrase', () => {
    expect(parseCardPage('Bellona', "'''Bellona''' is the Leader of the Roman Pantheon.\n\nHer special ability allows her to spend 2 mana to move a unit up to 2 Tiles away.")).toMatchObject({
      name: 'Bellona', type: 'Leader', pantheon: 'Roman',
      text: 'Her special ability allows her to spend 2 mana to move a unit up to 2 Tiles away.',
    });
  });

  it('rend une structure immobile, sans attaque si non précisée', () => {
    const c = parseCardPage('Hive', `{{Infobox\n|name=Hive\n|type=Structure\n|pantheon=Neutral\n|description=x\n|health=2\n|mana=1\n}}`)!;
    expect(c).toMatchObject({ attack: 0, health: 2, movement: 0, attackRange: null });
  });

  it('ignore une page sans carte', () => {
    expect(parseCardPage('Runes', 'Runes are the premium currency.')).toBeNull();
    expect(parseCardPage('Taunt', '#REDIRECT [[Guard]]')).toBeNull();
  });
});

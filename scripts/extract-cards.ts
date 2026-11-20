// Extrait les cartes du dump du wiki fandom (data/raw/hotg-wiki-pages.json) vers data/hotg-cards.json.
// Usage : npx tsx scripts/extract-cards.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { CARD_TYPES, type Card, type CardType } from '../src/cards.js';

function cleanWiki(s: string): string {
  return s
    .replace(/'''?/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function num(v: string | undefined): number | null {
  if (v === undefined) return null;
  const m = /^\s*(\d+)\s*$/.exec(v);
  return m ? Number(m[1]) : null;
}

function templateFields(text: string): Record<string, string> | null {
  const m = /\{\{\s*(?:Infobox|Cards)\s*\n([\s\S]*?)\n\}\}/i.exec(text);
  if (!m) return null;
  const f: Record<string, string> = {};
  for (const line of m[1]!.split('\n')) {
    const kv = /^\s*\|\s*([\w ]+?)\s*=(.*)$/.exec(line);
    if (kv) f[kv[1]!.toLowerCase()] = kv[2]!.trim();
  }
  return f;
}

function normalizeType(raw: string | undefined, unitType: string | undefined): CardType | null {
  const t = (unitType || raw || '').trim();
  const found = CARD_TYPES.find(x => x.toLowerCase() === t.toLowerCase());
  return found ?? null;
}

function attackRange(text: string, desc: string): 'melee' | 'ranged' | null {
  if (/is a Ranged unit|\bRanged\b/i.test(desc) || /is a Ranged unit/i.test(text)) return 'ranged';
  if (/is a Melee unit/i.test(text)) return 'melee';
  return null;
}

export function parseCardPage(title: string, text: string): Card | null {
  if (/^#redirect/i.test(text.trim())) return null;
  if (/^.+ - .+$/.test(title) && /Leader/i.test(text) && /skin/i.test(text)) return null; // skin cosmétique
  const f = templateFields(text);
  if (f) {
    const type = normalizeType(f.type, f['unit type']);
    if (!type) return null;
    const desc = cleanWiki(f.description ?? '');
    const isUnit = type !== 'Item' && type !== 'Leader';
    const isStructure = type === 'Structure';
    const attack = num(f.damage ?? f.attack) ?? (isStructure ? 0 : null);
    return {
      name: cleanWiki(f.name || title),
      type,
      pantheon: (f.pantheon ?? f['pantheon'])?.trim() || null,
      rarity: f.rarity?.trim() || null,
      mana: num(f.mana),
      attack,
      health: num(f.health),
      movement: num(f.movement) ?? (isStructure ? 0 : null),
      attackRange: isUnit && attack ? (attackRange(text, desc) ?? 'melee') : null,
      text: desc,
    };
  }
  const type = /Card type:\s*(\w+)/i.exec(text)?.[1];
  const sentence = /is the Leader of the (\w+) Pantheon\.\s*\n+([^\n]+)/i.exec(text);
  if (type?.toLowerCase() !== 'leader' && !sentence) return null;
  return {
    name: title,
    type: 'Leader',
    pantheon: /Pantheon:\s*(\w+)/i.exec(text)?.[1] ?? sentence?.[1] ?? null,
    rarity: null,
    mana: null, attack: null, health: null, movement: null, attackRange: null,
    text: cleanWiki(/Description:\s*(.*)/i.exec(text)?.[1] ?? sentence?.[2] ?? ''),
  };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()!)) {
  const pages = JSON.parse(readFileSync(new URL('../data/raw/hotg-wiki-pages.json', import.meta.url), 'utf8')) as Record<string, { text: string }>;
  const cards = Object.entries(pages)
    .map(([t, p]) => parseCardPage(t, p.text))
    .filter((c): c is Card => c !== null)
    .sort((a, b) => a.type.localeCompare(b.type) || (a.pantheon ?? '').localeCompare(b.pantheon ?? '') || a.name.localeCompare(b.name));
  writeFileSync(new URL('../data/hotg-cards.json', import.meta.url), JSON.stringify(cards, null, 1) + '\n');
  console.log(`${cards.length} cartes extraites`);
}

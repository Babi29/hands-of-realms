import { apply, attackableCells, deployCells, reachableCells, MANA_TOKEN, type Action, type GameState } from '../engine.js';
import { formatCell, parseCell } from '../board.js';

export type Selection = { kind: 'hand'; index: number } | { kind: 'unit'; id: number } | null;
export interface UIState { game: GameState; selected: Selection; error: string | null; log: string[] }
export type Click = { kind: 'hand'; index: number } | { kind: 'cell'; cell: string } | { kind: 'endTurn' };

export const initUI = (game: GameState): UIState => ({ game, selected: null, error: null, log: [] });

const who = (g: GameState) => `J${g.active + 1}`;

function run(s: UIState, action: Action, msg: string, selected: Selection = null): UIState {
  try {
    const game = apply(s.game, action);
    const log = [...s.log, msg];
    if (game.winner !== null) log.push(`Victoire de J${game.winner + 1} !`);
    return { game, selected, error: null, log };
  } catch (e) {
    return { ...s, selected: null, error: (e as Error).message };
  }
}

export function highlights(s: UIState): { move: string[]; attack: string[]; deploy: string[] } {
  const none = { move: [], attack: [], deploy: [] };
  if (!s.selected || s.game.winner !== null) return none;
  if (s.selected.kind === 'hand') return { ...none, deploy: deployCells(s.game) };
  const u = s.game.units.find(x => x.id === (s.selected as { id: number }).id);
  if (!u) return none;
  return {
    move: u.moved || u.attacked ? [] : reachableCells(s.game, u.id),
    attack: u.attacked ? [] : attackableCells(s.game, u.id),
    deploy: [],
  };
}

export function click(s: UIState, c: Click): UIState {
  const g = s.game;
  const me = g.players[g.active];
  if (c.kind === 'endTurn') return run(s, { type: 'endTurn' }, `${who(g)} termine son tour`);

  if (c.kind === 'hand') {
    const card = me.hand[c.index];
    if (!card) return { ...s, selected: null };
    if (card.name === MANA_TOKEN.name && card.type === 'Item')
      return run(s, { type: 'play', handIndex: c.index }, `${who(g)} joue la carte Mana (+1)`);
    if ((card.mana ?? 0) > me.mana) return { ...s, selected: null, error: `Pas assez de mana (${me.mana}/${card.mana})` };
    return { ...s, selected: { kind: 'hand', index: c.index }, error: null };
  }

  const h = highlights(s);
  if (s.selected?.kind === 'hand') {
    const card = me.hand[s.selected.index]!;
    if (h.deploy.includes(c.cell))
      return run(s, { type: 'play', handIndex: s.selected.index, cell: c.cell }, `${who(g)} déploie ${card.name} en ${c.cell}`);
  }
  if (s.selected?.kind === 'unit') {
    const u = g.units.find(x => x.id === (s.selected as { id: number }).id)!;
    if (h.attack.includes(c.cell)) {
      const target = g.units.find(x => formatCell(x.pos) === c.cell);
      const what = target ? target.name : 'le cristal adverse';
      return run(s, { type: 'attack', unitId: u.id, cell: c.cell }, `${u.name} attaque ${what} (${u.attack} dégâts)`);
    }
    if (h.move.includes(c.cell)) return run(s, { type: 'move', unitId: u.id, cell: c.cell }, `${u.name} va en ${c.cell}`, { kind: 'unit', id: u.id });
  }
  const pos = parseCell(c.cell);
  const mine = g.units.find(x => x.pos.row === pos.row && x.pos.col === pos.col && x.owner === g.active && !x.exhausted && !x.attacked);
  return { ...s, selected: mine ? { kind: 'unit', id: mine.id } : null, error: null };
}

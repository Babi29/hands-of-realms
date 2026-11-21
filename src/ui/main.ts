import cardsData from '../../data/hotg-cards.json' with { type: 'json' };
import type { Card } from '../cards.js';
import { COLS, ROWS, formatCell } from '../board.js';
import { newGame, MANA_TOKEN, type PlayerId } from '../engine.js';
import { buildDeck, mulberry32, playablePantheons } from './deck.js';
import { click, hasAnyAction, highlights, initUI, type Click, type UIState } from './controller.js';

const cards = cardsData as Card[];
const app = document.getElementById('app')!;
const FR: Record<string, string> = { Greek: 'Grec', Egyptian: 'Égyptien', Norse: 'Nordique', Roman: 'Romain', Chinese: 'Chinois', Mayan: 'Maya' };
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

let state: UIState | null = null;
let pantheons: [string, string] = ['Greek', 'Egyptian'];

function setup() {
  const opts = playablePantheons(cards).map(p => `<option value="${p}">${FR[p] ?? p}</option>`).join('');
  app.innerHTML = `
    <div class="top"><h1>Hand of Realms</h1><span class="sub">Banc d'essai du moteur, à deux joueurs sur le même écran</span></div>
    <form class="setup" id="setup">
      <label for="p1">Panthéon du joueur 1 (bleu)<select id="p1">${opts}</select></label>
      <label for="p2">Panthéon du joueur 2 (rouge)<select id="p2">${opts}</select></label>
      <label for="seed">Graine du mélange<input id="seed" type="number" value="${Math.floor(Math.random() * 10000)}"></label>
      <p class="sub" style="margin:0">Decks de 25 unités tirées du panthéon et des neutres. Les objets et les mots-clés ne sont pas encore gérés.</p>
      <button class="primary" type="submit">Commencer la partie</button>
    </form>`;
  (document.getElementById('p2') as HTMLSelectElement).value = 'Egyptian';
  document.getElementById('setup')!.addEventListener('submit', e => {
    e.preventDefault();
    const v = (id: string) => (document.getElementById(id) as HTMLInputElement).value;
    pantheons = [v('p1'), v('p2')];
    const rng = mulberry32(Number(v('seed')) || 1);
    const first = (rng() < 0.5 ? 0 : 1) as PlayerId;
    state = initUI(newGame({ decks: [buildDeck(cards, pantheons[0], rng), buildDeck(cards, pantheons[1], rng)], first }));
    state.log.push(`J${first + 1} commence (tiré au sort)`);
    render();
  });
}

function bar(s: UIState, p: PlayerId) {
  const pl = s.game.players[p];
  const pips = Array.from({ length: pl.maxMana }, (_, i) => `<span class="pip${i < pl.mana ? ' full' : ''}"></span>`).join('');
  const extra = pl.mana > pl.maxMana ? ` +${pl.mana - pl.maxMana}` : '';
  return `<div class="bar p${p + 1}${s.game.active === p ? ' active' : ''}">
    <span class="who">J${p + 1} · ${FR[pantheons[p]] ?? pantheons[p]}</span>
    <span>Cristal <span class="stat">${pl.crystalHp}/25</span></span>
    <span>Mana <span class="pips">${pips}</span> <span class="stat">${pl.mana}/${pl.maxMana}${extra}</span></span>
    <span>Main <span class="stat">${pl.hand.length}</span></span>
    <span>Deck <span class="stat">${pl.deck.length}</span></span>
    ${s.game.active === p ? '<span class="sub">à son tour</span>' : ''}
  </div>`;
}

function board(s: UIState) {
  const h = highlights(s);
  const sel = s.selected?.kind === 'unit' ? s.selected.id : null;
  let html = '<span></span>' + Array.from({ length: COLS }, (_, c) => `<span class="axis">${c + 1}</span>`).join('');
  for (let r = 0; r < ROWS; r++) {
    html += `<span class="axis">${'ABCDE'[r]}</span>`;
    for (let c = 0; c < COLS; c++) {
      const id = formatCell({ row: r, col: c });
      const u = s.game.units.find(x => x.pos.row === r && x.pos.col === c);
      const crystal = ([0, 1] as const).find(p => s.game.players[p].crystal.row === r && s.game.players[p].crystal.col === c);
      const cls = ['cell', (r + c) % 2 ? 'alt' : '', h.deploy.includes(id) ? 'deploy' : '', h.move.includes(id) ? 'move' : '', h.attack.includes(id) ? 'attack' : '', u && u.id === sel ? 'sel' : ''].join(' ');
      let inner = '';
      if (crystal !== undefined) inner = `<span class="crystal o${crystal}">${s.game.players[crystal].crystalHp}</span>`;
      if (u) {
        const done = u.owner === s.game.active && (u.exhausted || u.attacked);
        inner = `<span class="unit o${u.owner}${done ? ' done' : ''}" title="${esc(u.name)}"><span class="rg">${u.attackRange === 'ranged' ? '➶' : ''}</span><span class="nm" lang="en">${esc(u.name)}</span><span class="st"><span>${u.attack}</span><span>${u.health}</span></span></span>`;
      }
      const label = u ? `${id} : ${u.name}, ${u.attack} attaque, ${u.health} PV` : crystal !== undefined ? `${id} : cristal J${crystal + 1}` : id;
      html += `<button class="${cls}" data-cell="${id}" aria-label="${esc(label)}">${inner}</button>`;
    }
  }
  return `<div class="board-area"><div class="board-wrap"><div class="board">${html}</div></div></div>`;
}

function hand(s: UIState) {
  const pl = s.game.players[s.game.active];
  return `<div class="hand">${pl.hand.map((c, i) => {
    const isSel = s.selected?.kind === 'hand' && s.selected.index === i;
    const poor = (c.mana ?? 0) > pl.mana;
    const meta = c.name === MANA_TOKEN.name && c.type === 'Item' ? '+1 mana ce tour' :
      `${c.attack} ATQ · ${c.health} PV · ${c.movement} dépl.${c.attackRange === 'ranged' ? ' · tir' : ''}`;
    return `<button class="card${isSel ? ' sel' : ''}${poor ? ' poor' : ''}" data-hand="${i}" title="${esc(c.text)}">
      <span class="cost">${c.mana ?? 0} mana</span><span class="nm">${esc(c.name)}</span><span class="meta">${meta}</span></button>`;
  }).join('')}</div>`;
}

function detail(s: UIState) {
  let c: Card | undefined;
  let extra = '';
  if (s.selected?.kind === 'hand') c = s.game.players[s.game.active].hand[s.selected.index];
  if (s.selected?.kind === 'unit') {
    const u = s.game.units.find(x => x.id === (s.selected as { id: number }).id);
    if (u) { c = cards.find(x => x.name === u.name); extra = `PV ${u.health}/${u.maxHealth}${u.moved ? ' · a bougé' : ''}`; }
  }
  if (!c) return '<p class="sub" style="margin:0">Choisis une carte ou une de tes unités. Or : déploiement, vert : déplacement, rouge : cible.</p>';
  return `<h2>${esc(c.name)}</h2><span class="sub">${c.type} · ${FR[c.pantheon ?? ''] ?? c.pantheon ?? ''} · ${c.rarity ?? ''}</span>${extra ? `<span>${extra}</span>` : ''}<span>${esc(c.text || 'Pas de texte.')}</span>${c.text ? '<span class="sub">Effet affiché seulement : pas encore géré par le moteur.</span>' : ''}`;
}

function render() {
  const s = state!;
  const idle = !hasAnyAction(s);
  const win = s.game.winner !== null ? `<div class="win">Victoire du joueur ${s.game.winner + 1}</div>` : '';
  app.innerHTML = `
    <div class="top"><h1>Hand of Realms</h1><span class="sub">Tour ${s.game.turn}</span></div>
    <div class="game">
      <div class="main">
        ${bar(s, 1)}
        ${board(s)}
        ${bar(s, 0)}
        <div class="actions">${win}<button class="primary${idle ? ' nudge' : ''}" data-end ${s.game.winner !== null ? 'disabled' : ''}>Fin du tour de J${s.game.active + 1}</button><button class="ghost" data-new>Nouvelle partie</button><span class="err" role="status">${esc(s.error ?? '')}</span>${idle && !s.error ? '<span class="sub">Plus rien à jouer ce tour : clique sur « Fin du tour ».</span>' : ''}</div>
        ${hand(s)}
      </div>
      <div class="side">
        <div class="panel">${detail(s)}</div>
        <div class="panel"><h2>Journal</h2><div class="log">${s.log.slice(-40).map(l => `<div>${esc(l)}</div>`).join('')}</div></div>
      </div>
    </div>`;
  const log = app.querySelector('.log');
  if (log) log.scrollTop = log.scrollHeight;
}

app.addEventListener('click', e => {
  if (!state) return;
  const t = (e.target as HTMLElement).closest('button');
  if (!t) return;
  let c: Click | null = null;
  if (t.dataset.cell) c = { kind: 'cell', cell: t.dataset.cell };
  else if (t.dataset.hand !== undefined) c = { kind: 'hand', index: Number(t.dataset.hand) };
  else if (t.hasAttribute('data-end')) c = { kind: 'endTurn' };
  else if (t.hasAttribute('data-new')) { state = null; setup(); return; }
  if (c) { state = click(state, c); render(); }
});

setup();

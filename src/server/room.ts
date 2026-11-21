import type { Card } from '../cards.js';
import { applyWithEvents, newGame, type Action, type GameEvent, type GameState, type PlayerId } from '../engine.js';
import { buildDeck, mulberry32 } from '../ui/deck.js';
import { playerView, type PlayerView } from './view.js';

export type ServerMsg =
  | { type: 'joined'; seat: PlayerId; room: string }
  | { type: 'waiting' }
  | { type: 'state'; view: PlayerView }
  | { type: 'events'; events: GameEvent[] }
  | { type: 'error'; message: string };

export interface Outbound { seat: PlayerId; msg: ServerMsg }

/** Un salon à deux joueurs. Le serveur fait autorité : toute action passe par le moteur. */
export class Room {
  game: GameState | null = null;
  private seats: { name: string; pantheon: string }[] = [];
  private rng: () => number;

  constructor(private cards: readonly Card[], seed: number, readonly id = 'default') {
    this.rng = mulberry32(seed);
  }

  get size() { return this.seats.length; }

  join(name: string, pantheon: string): Outbound[] {
    if (this.seats.length >= 2) throw new Error('Salon complet');
    const seat = this.seats.length as PlayerId;
    this.seats.push({ name, pantheon });
    const out: Outbound[] = [{ seat, msg: { type: 'joined', seat, room: this.id } }];
    if (this.seats.length < 2) return [...out, { seat, msg: { type: 'waiting' } }];
    const first = (this.rng() < 0.5 ? 0 : 1) as PlayerId;
    this.game = newGame({
      decks: [buildDeck(this.cards, this.seats[0]!.pantheon, this.rng), buildDeck(this.cards, this.seats[1]!.pantheon, this.rng)],
      first,
    });
    return [...out, ...this.states()];
  }

  act(seat: PlayerId, action: Action): Outbound[] {
    if (!this.game) return [{ seat, msg: { type: 'error', message: 'La partie n\'a pas commencé' } }];
    if (this.game.active !== seat) return [{ seat, msg: { type: 'error', message: 'Ce n\'est pas votre tour' } }];
    try {
      const { state, events } = applyWithEvents(this.game, action);
      this.game = state;
      return ([0, 1] as const).flatMap(s => [{ seat: s, msg: { type: 'events', events } } as Outbound, this.stateFor(s)]);
    } catch (e) {
      return [{ seat, msg: { type: 'error', message: (e as Error).message } }];
    }
  }

  private stateFor(seat: PlayerId): Outbound {
    const view = playerView(this.game!, seat);
    view.names = [this.seats[0]!.name, this.seats[1]!.name];
    view.pantheons = [this.seats[0]!.pantheon, this.seats[1]!.pantheon];
    return { seat, msg: { type: 'state', view } };
  }

  private states(): Outbound[] {
    return [this.stateFor(0), this.stateFor(1)];
  }
}

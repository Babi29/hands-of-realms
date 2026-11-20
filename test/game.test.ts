import { describe, it, expect } from 'vitest';
import { newGame, damageCrystal, crystalAt } from '../src/game.js';

describe('partie', () => {
  it('place le cristal du joueur 1 en C2 et celui du joueur 2 en C7, à 25 PV', () => {
    const g = newGame();
    expect(crystalAt(g, 'C2')).toEqual({ owner: 0, hp: 25 });
    expect(crystalAt(g, 'C7')).toEqual({ owner: 1, hp: 25 });
    expect(crystalAt(g, 'C3')).toBeUndefined();
    expect(g.winner).toBeNull();
  });

  it('réduit les PV du cristal sans modifier l\'état d\'origine', () => {
    const g = newGame();
    const g2 = damageCrystal(g, 1, 4);
    expect(g2.players[1].crystalHp).toBe(21);
    expect(g.players[1].crystalHp).toBe(25);
    expect(g2.winner).toBeNull();
  });

  it('déclare le vainqueur quand un cristal tombe à 0, sans PV négatifs', () => {
    const g = damageCrystal(newGame(), 1, 30);
    expect(g.players[1].crystalHp).toBe(0);
    expect(g.winner).toBe(0);
  });

  it('refuse des dégâts négatifs', () => {
    expect(() => damageCrystal(newGame(), 0, -1)).toThrow();
  });
});

import { describe, it, expect } from 'vitest';
import { ROWS, COLS, parseCell, formatCell, isOnBoard, allCells } from '../src/board.js';

describe('plateau', () => {
  it('fait 5 rangées (A-E) sur 8 colonnes (1-8)', () => {
    expect(ROWS).toBe(5);
    expect(COLS).toBe(8);
    expect(allCells()).toHaveLength(40);
  });

  it('convertit une case nommée en coordonnées et inversement', () => {
    expect(parseCell('A1')).toEqual({ row: 0, col: 0 });
    expect(parseCell('C2')).toEqual({ row: 2, col: 1 });
    expect(parseCell('E8')).toEqual({ row: 4, col: 7 });
    expect(formatCell({ row: 2, col: 6 })).toBe('C7');
  });

  it('rejette une case hors plateau', () => {
    expect(() => parseCell('F1')).toThrow();
    expect(() => parseCell('A9')).toThrow();
    expect(() => parseCell('A0')).toThrow();
    expect(isOnBoard({ row: 5, col: 0 })).toBe(false);
    expect(isOnBoard({ row: 0, col: -1 })).toBe(false);
    expect(isOnBoard({ row: 4, col: 7 })).toBe(true);
  });
});

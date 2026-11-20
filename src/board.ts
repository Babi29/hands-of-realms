export const ROWS = 5;
export const COLS = 8;
const ROW_LETTERS = 'ABCDE';

export interface Pos { row: number; col: number }

export function isOnBoard(p: Pos): boolean {
  return Number.isInteger(p.row) && Number.isInteger(p.col)
    && p.row >= 0 && p.row < ROWS && p.col >= 0 && p.col < COLS;
}

export function parseCell(id: string): Pos {
  const m = /^([A-Z])(\d+)$/.exec(id);
  if (!m) throw new Error(`Case invalide : ${id}`);
  const p = { row: ROW_LETTERS.indexOf(m[1]!), col: Number(m[2]) - 1 };
  if (p.row < 0 || !isOnBoard(p)) throw new Error(`Case hors plateau : ${id}`);
  return p;
}

export function formatCell(p: Pos): string {
  if (!isOnBoard(p)) throw new Error(`Position hors plateau : ${JSON.stringify(p)}`);
  return `${ROW_LETTERS[p.row]}${p.col + 1}`;
}

export function allCells(): Pos[] {
  const cells: Pos[] = [];
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) cells.push({ row, col });
  return cells;
}

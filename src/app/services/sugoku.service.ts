import { Injectable, afterNextRender, signal } from '@angular/core';

type Status = 'unsolved' | 'solved' | 'broken';

function encodeBoard(board: number[][]) {
  return board.reduce(
    (result, row, i) =>
      result +
      `%5B${encodeURIComponent(row as any)}%5D${i === board.length - 1 ? '' : '%2C'}`,
    '',
  );
}

function encodeParams(params: { board: number[][] }) {
  return Object.keys(params)
    .map((key) => key + '=' + `%5B${encodeBoard(params[key as 'board'])}%5D`)
    .join('&');
}

@Injectable({
  providedIn: 'root',
})
export class SudokuService {
  private _board = signal<number[][]>([]);
  private _status = signal<Status>('unsolved');

  board = this._board.asReadonly();
  status = this._status.asReadonly();
  dynamicCells = new Set<string>([]);

  constructor() {
    afterNextRender(() => {
      this.loadBoard();
    });
  }

  private async loadBoard() {
    return await fetch('https://sugoku.onrender.com/board?difficulty=random')
      .then((res) => res.json())
      .then(({ board }) => {
        this._board.set(board);
        this._status.set('unsolved');
      });
  }

  async validate() {
    return await fetch('https://sugoku.onrender.com/validate', {
      method: 'POST',
      body: encodeParams({ board: this.board() }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
      .then((response) => response.json())
      .then(({ status }) => this._status.set(status))
      .catch(console.warn);
  }

  async solve() {
    return await fetch('https://sugoku.onrender.com/solve', {
      method: 'POST',
      body: encodeParams({ board: this.board() }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
      .then((response) => response.json())
      .then(({ solution, status }) => {
        this._board.set(solution);
        this._status.set(status);
      })
      .catch(console.warn);
  }

  clear() {
    this.dynamicCells.forEach((cell) => {
      const [rowIndex, colIndex] = cell.split('-');
      this.updateBoard(0, +rowIndex, +colIndex);
    });
  }

  updateBoard(value: number, rowIndex: number, colIndex: number) {
    this.dynamicCells.add(`${rowIndex}-${colIndex}`);

    this._board.update((prev) =>
      prev.map((row, rIndex) => {
        if (rowIndex !== rIndex) return row;
        return row.map((col, cIndex) => {
          if (colIndex !== cIndex) return col;
          return value;
        });
      }),
    );
  }

  isReadonly(value: number, rowIndex: number, colIndex: number) {
    return value !== 0 && !this.dynamicCells.has(`${rowIndex}-${colIndex}`);
  }
}
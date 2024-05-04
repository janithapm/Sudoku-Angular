import { Component, effect, inject } from '@angular/core';
import {SudokuService} from '../services/sugoku.service'

@Component({
  selector: 'app-cell',
  standalone: true,
  imports: [],
  templateUrl: './cell.component.html',
  styleUrl: './cell.component.css'
})
export class CellComponent {
  protected service = inject(SudokuService);

  constructor() {
    effect(() => {
      console.log(this.service.board());
    });
  }

  onChange(event: Event, rowIndex: number, colIndex: number) {
    const value = (event.target as HTMLInputElement).valueAsNumber;

    this.service.updateBoard(value, rowIndex, colIndex);
  }
}

import { AfterViewInit, ChangeDetectorRef, Component, Input } from '@angular/core';
import { IRound, IGameVideo, IVideo, IGameRound } from '../../models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-field',
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss'
})
export class FieldComponent implements AfterViewInit{
  @Input() round!: IGameRound;
  rows: IGameVideo[][] = [];

  constructor(private cdr: ChangeDetectorRef){

  }

  ngAfterViewInit(): void {
    for (let i = 0; i < this.round.roundFieldRows; i ++) {
      this.rows.push([...this.round.videos].slice(i * this.round.roundFieldColumns, (i * this.round.roundFieldColumns) + this.round.roundFieldColumns));
    }
    this.rows = [...this.rows];
    this.cdr.detectChanges();
  }

}

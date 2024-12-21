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
    for (let i = 0; i < [...this.round.videos].length; i += this.round.roundFieldRows) {
      this.rows.push([...this.round.videos].slice(i, i + this.round.roundFieldRows));
    }
    this.rows = [...this.rows];
    this.cdr.detectChanges();
  }

}

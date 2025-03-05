import { Component, Input } from '@angular/core';
import { IRound, IRoundSong } from '../../models/models';

@Component({
  selector: 'app-field',
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss'
})
export class FieldComponent {
  @Input() round!: IRound;
  rows: IRoundSong[][] = [];

  constructor(){

  }

}

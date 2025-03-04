import { Component, Input } from '@angular/core';
import { NEW_IRound, NEW_IRoundSong } from '../../models/models';

@Component({
  selector: 'app-field',
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss'
})
export class FieldComponent {
  @Input() round!: NEW_IRound;
  rows: NEW_IRoundSong[][] = [];

  constructor(){

  }

}

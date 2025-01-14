import {  Component } from '@angular/core';
import { StateService } from './services/state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor (public stateService: StateService) {}

  nextRound(){
    this.stateService.$nextRound.next(undefined);
  }
}

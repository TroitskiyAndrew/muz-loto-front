import {  Component } from '@angular/core';
import { StateService } from './services/state.service';
import { ModalService } from './services/modal.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor (public stateService: StateService, public modalService: ModalService) {}
}

import {  Component } from '@angular/core';
import { StateService } from './services/state.service';
import { ModalService } from './services/modal.service';
import { SocketService } from './services/socket.service';
import { SocketMessageType } from './models/models';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
let i = 0;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor (public stateService: StateService, public modalService: ModalService, private socketService: SocketService, private authService: AuthService, private router: Router) {
    this.socketService.onMessage<boolean>(SocketMessageType.Modal, ({data, gameCode}) => {
      this.modalService.submitAnswer(data);
    });
    this.init();
  }

  async init(){
    const userId = localStorage.getItem('user');
    if(userId){
      await this.authService.restoreUser(userId);
    }
  }

  goHome(){
    this.router.navigate(['']);
  }
}

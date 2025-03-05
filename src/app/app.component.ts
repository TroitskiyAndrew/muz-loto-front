import {  Component } from '@angular/core';
import { StateService } from './services/state.service';
import { ModalService } from './services/modal.service';
import { SocketService } from './services/socket.service';
import { SocketMessageType } from './models/models';
import { AuthService } from './services/auth.service';
let i = 0;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor (public stateService: StateService, public modalService: ModalService, private socketService: SocketService, private authService: AuthService) {
    // this.socketService.onMessage<boolean>(SocketMessageType.Modal, ({data}) => {
    //   this.modalService.submitAnswer(data);
    // });
    this.init();
  }

  async init(){
    const userId = localStorage.getItem('user');
    if(userId){
      await this.authService.restoreUser(userId);
    }
  }
}

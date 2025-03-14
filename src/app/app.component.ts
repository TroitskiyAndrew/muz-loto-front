import { Component, OnDestroy } from '@angular/core';
import { StateService } from './services/state.service';
import { ModalService } from './services/modal.service';
import { SocketService } from './services/socket.service';
import { SocketMessageType } from './models/models';
import { AuthService } from './services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from './services/api.service';
import { LoadingService } from './services/loading.service';
import { DialogService } from './services/dialog.service';
let i = 0;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnDestroy{


  constructor(
    public stateService: StateService,
    public modalService: ModalService,
    private socketService: SocketService,
    private authService: AuthService,
    private router: Router,
    private loadingService: LoadingService,
    private dialogService: DialogService,
    private route: ActivatedRoute,
  ) {
    this.socketService.onMessage<boolean>(
      SocketMessageType.Modal,
      ({ data, gameCode }) => {
        this.modalService.submitAnswer(data);
      }
    );
    console.log(history)
    this.init();
  }

  async init() {
    this.loadingService.show();
    await this.authService.restoreUser();
    this.loadingService.hide();
    this.stateService.$init.next(true);
  }

  goHome() {
    this.router.navigate(['']);
  }

  ngOnDestroy(): void {
    this.socketService.unsubscribe(SocketMessageType.Modal)
  }
}

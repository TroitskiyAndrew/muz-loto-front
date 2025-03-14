import { Component, OnDestroy, OnInit } from '@angular/core';
import { StateService } from './services/state.service';
import { ModalService } from './services/modal.service';
import { SocketService } from './services/socket.service';
import { SocketMessageType } from './models/models';
import { AuthService } from './services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from './services/api.service';
import { LoadingService } from './services/loading.service';
import { DialogService } from './services/dialog.service';
import { PlayerService } from './services/player.service';
let i = 0;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    public stateService: StateService,
    public modalService: ModalService,
    private socketService: SocketService,
    private authService: AuthService,
    private router: Router,
    private loadingService: LoadingService,
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {

    this.init();
  }

  async init() {
    this.loadingService.show();
    await this.authService.restoreUser();
    this.loadingService.hide();
    if (window.location.pathname.startsWith('/game/') && history.state.navigationId === 1) {
      const code  = window.location.pathname.slice(-5);
      const answer = await this.dialogService.init({
        disableClose: true,
        message: `Продолжаем игру ${code}?`,
        buttons: [
          {
            label: 'Ок',
            disabled: () => false,
            action: () => true,
          },
          {
            label: 'Выход',
            disabled: () => false,
            action: () => null,
            class: 'cancel',
          },
        ],
      });
      if (answer === null) {
        this.router.navigate(['']);
        return;
      }
      this.playerService.$startInit.next(true);
    } else {
      this.playerService.$startInit.next(true);
    }
    this.stateService.$init.next(true);
  }

  goHome() {
    this.router.navigate(['']);
  }

  ngOnDestroy(): void {
    this.socketService.unsubscribe(SocketMessageType.Modal);
  }
}

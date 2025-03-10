import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IGame } from '../../models/models';
import { Subject } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { StateService } from '../../services/state.service';
import { SocketService } from '../../services/socket.service';
import { DialogService } from '../../services/dialog.service';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-run-page',
  templateUrl: './run-page.component.html',
  styleUrl: './run-page.component.scss',
})
export class RunPageComponent {
  game!: IGame;
  $init = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private loadingService: LoadingService,
    private stateService: StateService,
    private socketService: SocketService,
    private dialogService: DialogService
  ) {
    this.init();
  }

  async init() {
    const code = this.route.snapshot.params['code'];
    if (!code) {
      throw new Error('нет кода');
    }
    this.loadingService.show();
    const game = await this.apiService.getGame(code);
    this.loadingService.hide();
    if (!game) {
      throw new Error('нет игры');
    }
    this.game = game;
    this.stateService.gameCode = game.code;
  }

  nextSong() {
    this.socketService.nextSong();
  }
  stopSong() {
    this.socketService.stopSong();
  }
  startGame() {
    this.socketService.startGame()
  }
  sendAnswer(answer: boolean) {
    this.socketService.modalAnswer(answer);
  }
  async addTickets() {
    const tickets = await this.getTicketNumbers();

    this.socketService.addTickets(tickets)
  }
  async excludeTickets() {
    const tickets = await this.getTicketNumbers();
    this.socketService.excludeTickets(tickets)
  }

  async getTicketNumbers(){
    const fromField = { id: 'from', type: 'number', label: 'Начиная с', control: new FormControl<number | null>(null, [Validators.min(1)]) };
    const toField = { id: 'to', type: 'number', label: 'Заканчивыая', control: new FormControl<number | null>(null, [Validators.min(1)]) };
    const exactField = { id: 'exact', type: 'number', label: 'Конкретные номера', control: new FormControl<number | null>(null, [Validators.min(1)]) };

    return  this.dialogService.init({
      message: 'Какие билеты',
      fields: [exactField, fromField, toField],
      buttons: [{
        label: 'Эти',
        disabled: () => exactField.control.invalid || fromField.control.invalid || toField.control.invalid,
        action: async () => {
          const exact = exactField.control.value ? Number(exactField.control.value) : null;
          const from = fromField.control.value ? Number(fromField.control.value) : null;
          const to = toField.control.value ? Number(toField.control.value) : null;
          if(exact) {
            return [exact];
          }
          else if(!from && !to){
            return [];
          } else {
            const first = from || 1;
            const last = to || 100;
            return Array.from({ length: last - first + 1 }, (_, i) => first + i);
          }
        }
      },
      {
        label: 'Отмена',
        disabled: () => false,
        action: () => [],
        class: 'cancel'
      }
      ]
    })
  }
}

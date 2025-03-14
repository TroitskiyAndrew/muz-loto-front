import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IGame } from '../../models/models';
import { Subject } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { StateService } from '../../services/state.service';
import { SocketService } from '../../services/socket.service';
import { DialogService } from '../../services/dialog.service';
import { FormControl, Validators } from '@angular/forms';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-run-page',
  templateUrl: './run-page.component.html',
  styleUrl: './run-page.component.scss',
})
export class RunPageComponent implements OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private loadingService: LoadingService,
    private stateService: StateService,
    private dialogService: DialogService,
    public gameService: GameService
  ) {
    this.init();
  }

  async init() {
    const code = this.route.snapshot.params['code'];
    if (!code) {
      throw new Error('нет кода');
    }
    this.loadingService.show();
    const game = await this.gameService.init({code, isFront: false});
    this.loadingService.hide();
    if (!game) {
      throw new Error('нет игры');
    }
    this.stateService.gameCode = game.code;
  }

  startStep() {
    this.gameService.makeStep();
  }
  finishStep() {
    this.gameService.sendFinishStepMessage(false);
  }
  startRound(roundIndex: number) {
    if(this.gameService.isRoundFinished(this.gameService.game, roundIndex)){
      return;
    }
    this.gameService.sendStartRoundMessage(roundIndex);
  }

  stopRound() {
    this.gameService.sendStopRoundMessage(false);
  }
  async addTickets() {
    const tickets = await this.getTicketNumbers();
    this.gameService.changePlayingTickets(tickets, true);
  }
  async excludeTickets() {
    const tickets = await this.getTicketNumbers();
    this.gameService.changePlayingTickets(tickets, false);
  }

  async getTicketNumbers() {
    const fromField = {
      id: 'from',
      type: 'number',
      label: 'Начиная с',
      control: new FormControl<number | null>(null, [Validators.min(1)]),
    };
    const toField = {
      id: 'to',
      type: 'number',
      label: 'Заканчивыая',
      control: new FormControl<number | null>(null, [Validators.min(1)]),
    };
    const exactField = {
      id: 'exact',
      type: 'number',
      label: 'Конкретные номера',
      control: new FormControl<number | null>(null, [Validators.min(1)]),
    };

    return this.dialogService.init({
      message: 'Какие билеты',
      fields: [exactField, fromField, toField],
      buttons: [
        {
          label: 'Эти',
          disabled: () =>
            exactField.control.invalid ||
            fromField.control.invalid ||
            toField.control.invalid ||
            (Boolean(fromField.control.value) &&
              Boolean(toField.control.value) && Number(toField.control.value) < Number(fromField.control.value)),
          action: async () => {
            const exact = exactField.control.value
              ? Number(exactField.control.value)
              : null;
            const from = fromField.control.value
              ? Number(fromField.control.value)
              : null;
            const to = toField.control.value
              ? Number(toField.control.value)
              : null;
            if (exact) {
              return [exact];
            } else if (!from && !to) {
              return [];
            } else {
              const first = from || 1;
              const last = to || this.gameService.game.ticketsCount;
              return Array.from(
                { length: last - first + 1 },
                (_, i) => first + i
              );
            }
          },
        },
        {
          label: 'Отмена',
          disabled: () => false,
          action: () => [],
          class: 'cancel',
        },
      ],
    }) as Promise<number[]>;
  }

  ngOnDestroy(): void {
    this.stateService.gameCode = '';
  }
}

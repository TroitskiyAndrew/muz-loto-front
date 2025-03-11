import { Component, HostListener } from '@angular/core';
import { IGame, ITicket, Winner } from '../../models/models';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { StateService } from '../../services/state.service';
import { Router } from '@angular/router';
import { tick } from '@angular/core/testing';
import { CreatorService } from '../../services/creator.service';
import { DialogService } from '../../services/dialog.service';
import { FormControl, Validators } from '@angular/forms';
import { getDefaultResults } from '../../constants/constants';

@Component({
  selector: 'app-games-page',
  templateUrl: './games-page.component.html',
  styleUrl: './games-page.component.scss',
})
export class GamesPageComponent {
  @HostListener('document:keydown.escape', ['$event'])
  handleEscape() {
    this.showTickets = false;
  }

  games: IGame[] = [];
  showTickets = false;
  tickets: ITicket[] = [];
  gameId = '';
  roundNames = ['Раунд 1', 'Раунд 2'];
  ticketLogo = '';

  constructor(
    private apiService: ApiService,
    private loadingService: LoadingService,
    public stateService: StateService,
    private router: Router,
    private creatorService: CreatorService,
    private dialogService: DialogService,
  ) {
    this.loadingService.show();
    const sub = this.stateService.$init.subscribe((init: boolean) => {
      if(!init){
        this.loadingService.hide()
        return;
      }
      this.apiService.getGames().then((games) => {
        this.games = games;
      }).finally(() => loadingService.hide());
      sub.unsubscribe()
    })

  }

  async printTickets(gameId: string, logo: string) {
    this.loadingService.show();
    this.ticketLogo = logo;
    this.gameId = gameId;
    this.tickets = await this.getTickets(gameId);
    console.log(this.tickets);
    this.loadingService.hide();
    this.showTickets = true;
  }

  private async getTickets(gameId: string) {
    return this.apiService.getTickets(gameId);
  }

  runGame(code: string) {
    this.router.navigate(['runGame', code]);
  }
  startGame(code: string) {
    this.router.navigate(['game', code]);
  }

  isResetDisabled(game: IGame) {
    return (
      !game.results.lastStart ||
      game.results.currentRoundIndex > 0 ||
      game.results.currentStep > 5
    );
  }

  async resetResults(game: IGame) {
    if (this.isResetDisabled(game)) {
      return;
    }
    const results = getDefaultResults(game.rounds.length);
    this.loadingService.show();
    await this.apiService.updateGame({ id: game.id, results });
    this.loadingService.hide();
    game.results = results;
  }

  async addTickets(game: IGame) {

    const addField = { id: 'code', type: 'number', label: '', control: new FormControl(1, [Validators.required, Validators.min(1), Validators.max(50)]) };
    await this.dialogService.init({
      message: 'Сколько добавить билетов?',
      fields: [addField],
      buttons: [{
        label: 'Ок',
        disabled: () => addField.control.invalid,
        action: async () => {
          this.loadingService.show();
          const tickets = await this.getTickets(game.id);
          const settings = tickets[0].rounds.map((ticket) => ({
            ticketFieldColumns: ticket.field[0].length,
            ticketFieldRows: ticket.field.length,
          }));
          this.loadingService.hide();
          await this.creatorService.generateTickets(game, settings, Number(addField.control.value));

        },
      },
      {
        label: 'Отмена',
        disabled: () => false,
        action: () => null,
        class: 'cancel'
      }
      ]
    })

      ;
  }
}

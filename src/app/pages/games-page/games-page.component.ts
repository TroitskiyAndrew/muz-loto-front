import { Component, HostListener, OnDestroy } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-games-page',
  templateUrl: './games-page.component.html',
  styleUrl: './games-page.component.scss',
})
export class GamesPageComponent implements OnDestroy {
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
  sub: Subscription;

  constructor(
    private apiService: ApiService,
    private loadingService: LoadingService,
    public stateService: StateService,
    private router: Router,
    private creatorService: CreatorService,
    private dialogService: DialogService,
    public gameService: GameService,
  ) {
    this.loadingService.show();
    this.sub = this.stateService.$init.subscribe((init: boolean) => {
      if (!init) {
        this.loadingService.hide();
        return;
      }
      this.apiService
        .getGames()
        .then((games) => {
          this.games = games;
        })
        .finally(() => loadingService.hide());
    });
  }

  async printTickets(game: IGame) {
    if(this.gameService.isGameFinished(game)){
      return;
    }
    this.loadingService.show();
    this.ticketLogo = game.logo;
    this.gameId = game.id;
    this.tickets = await this.getTickets(game.id);
    console.log(this.tickets);
    this.loadingService.hide();
    this.showTickets = true;
  }

  private async getTickets(gameId: string) {
    return this.apiService.getTickets(gameId);
  }

  runGame(game: IGame) {
    if(this.gameService.isGameFinished(game)){
      return;
    }
    this.router.navigate(['runGame', game.code]);
  }
  startGame(game: IGame) {
    if(this.gameService.isGameFinished(game)){
      return;
    }
    this.router.navigate(['game', game.code], {state: {game}});
  }

  isResetDisabled(game: IGame) {
    if(!game.results.lastStart){
      return true
    }
    if(game.testGame){
      return false;
    }
    if(this.stateService.user?.isAdmin){
      return false;
    }
    return game.results.rounds.some(roundResult => roundResult.playedSongs.length > 5);
  }

  async resetResults(game: IGame) {
    if (this.isResetDisabled(game)) {
      return;
    }
    const results = getDefaultResults(game.rounds);
    this.loadingService.show();
    await this.apiService.updateGame({ id: game.id, results });
    this.loadingService.hide();
    game.results = results;
  }

  async addTickets(game: IGame) {
    if(this.gameService.isGameFinished(game)){
      return;
    }
    const addField = {
      id: 'code',
      type: 'number',
      label: '',
      control: new FormControl(1, [
        Validators.required,
        Validators.min(1),
        Validators.max(50),
      ]),
    };
    await this.dialogService.init({
      message: 'Сколько добавить билетов?',
      fields: [addField],
      buttons: [
        {
          label: 'Ок',
          disabled: () => addField.control.invalid,
          action: async () => {
            this.loadingService.show();
            const tickets = await this.getTickets(game.id);
            const settings = tickets[0].rounds.map((ticket) => ({
              ticketFieldColumns: ticket.field[0].length,
              ticketFieldRows: ticket.field.length,
            }));

            await this.creatorService
              .generateTickets(
                game,
                settings,
                Number(addField.control.value),
                tickets.length
              )
              .then(
                (addedTickets) => (game.ticketsCount += addedTickets.length)
              )
              .finally(() => this.loadingService.hide());
          },
        },
        {
          label: 'Отмена',
          disabled: () => false,
          action: () => null,
          class: 'cancel',
        },
      ],
    });
  }

  async deleteGame(gameId: string){
    this.loadingService.show();
    await this.apiService.deleteGame(gameId);
    this.games = this.games.filter(game => game.id !== gameId);
    this.loadingService.hide();

  }

  getRoundResults(game: IGame, roundIndex: number){
    return game.results.rounds[roundIndex]?.playedSongs.length + '/' + game.rounds[roundIndex].field.flat().length;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}

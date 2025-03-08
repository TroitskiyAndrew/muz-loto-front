import { Component, HostListener } from '@angular/core';
import { IGame, ITicket } from '../../models/models';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { StateService } from '../../services/state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-games-page',
  templateUrl: './games-page.component.html',
  styleUrl: './games-page.component.scss'
})
export class GamesPageComponent {

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape() {
    this.showTickets = false;
  }

  games: IGame[] = [];
  showTickets = false;
  tickets: ITicket[] = [];
  roundNames = ['Раунд 1', 'Раунд 2'];
  ticketLogo = "";

  constructor(private apiService: ApiService, private loadingService: LoadingService, public stateService: StateService, private router: Router) {
    loadingService.show()
    this.apiService.getGames().then(games => {
      this.games = games;
      loadingService.hide()
    })
  }

  async printTickets(gameId: string, logo: string){
    this.ticketLogo = logo;
    this.tickets = await this.apiService.getTickets(gameId);
    this.showTickets = true;
  }

  runGame(code: string){
    this.router.navigate(['runGame', code])
  }
  startGame(code: string){
    this.router.navigate(['game', code])
  }
}

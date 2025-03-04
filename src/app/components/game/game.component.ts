import { Component } from '@angular/core';
import {
  IGameSettings,
  NEW_IGame,
  NEW_IPlayingRound,
  NEW_IPlayingTicketRound,
  NEW_IRoundSong,
  NEW_ITicket,
  Weight,
  Winner,
} from '../../models/models';
import { PlayerService } from '../../services/player.service';
import { environment } from '../../../environments/environment';
import { StateService } from '../../services/state.service';
import { CreatorService } from '../../services/creator.service';
import { getRandomElem } from '../../utils/utils';
import { ModalService } from '../../services/modal.service';

const DEEP = 0;

const WIN_NAMING = {
  [Winner.Line]: 'Линию',
  [Winner.Cross]: 'Крест',
  [Winner.All]: 'Все песни',
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent {
  public isGameStarted = false;
  public showName = false;
  wantedWinner: Winner | null = Winner.Line;
  time = 0;
  currentStep = 0;
  songsArray: string[] = [];
  deep = DEEP;
  boost = 1000;
  errors = 0;
  winnersNumbers: number[] = [];
  wastedTickets:  number[] = [];
  new_game!: NEW_IGame;
  new_tickets!: NEW_ITicket[];
  new_currentRound: NEW_IPlayingRound | null = null;
  new_currentRoundTickets: NEW_IPlayingTicketRound[] = [];
  new_selectedSong: NEW_IRoundSong | null = null;
  playedSongs: string[] = [];
  roundIndex = 0;
  new_winners: Set<number> = new Set();
  new_simulation = false;


  constructor(
    private playerService: PlayerService,
    public stateService: StateService,
    private creatorService: CreatorService,
    private modalService: ModalService,
  ) {
    // this.simulateGames(50);
  }

  startGame() {
    this.isGameStarted = true;
    this.new_game = this.creatorService.generateGame();
    this.new_tickets = this.creatorService.generateTickets(this.new_game);
    this.playNewGame();
    // this.simulateGames(10)
  }

  simulateGames(count: number) {
    for (let index = 0; index < count; index++) {
      this.simulateNewGame();
      console.log(`${this.errors}/${(index + 1)*2}`)
    }
  }

  simulateNewGame() {
    this.new_game = this.creatorService.generateGame();
    this.new_tickets = this.creatorService.generateTickets(this.new_game);
    this.winnersNumbers = [];
    this.wastedTickets = this.new_tickets.map(ticket => ticket.number).filter(number => number > 10);

    for (let i = 0; i < this.new_game.rounds.length; i++) {
      this.roundIndex = i;
      this.simulateRound();
    }
  }

  simulateRound() {
    this.prepareRound();
    console.log('players ', this.new_currentRoundTickets.length -  this.wastedTickets.length);
    this.simulateStep();
  }


  simulateStep(){
    this.currentStep++;
    this.deep = DEEP + Math.floor(this.currentStep / 10);
    const selectedSongId = this.selectSong();
    this.new_winners = this.getWinners(selectedSongId);
    this.playedSongs.push(selectedSongId);

    if (this.wantedWinner && this.new_winners.size > (this.new_currentRound?.[this.wantedWinner].count || 99)) {
      this.errors++
    }
    if(this.new_winners.size){
      this.submitWin();
    }
    if(this.playedSongs.length < this.roundSongs.length){
      this.simulateStep();
    }
  }

  playNewGame(){
    this.winnersNumbers = [];
    this.wastedTickets = [];
    this.roundIndex = 0;
    this.prepareRound();
  }

  prepareRound() {
    this.showName = false;
    this.playedSongs = [];
    this.currentStep = 0;
    this.wantedWinner = Winner.Line;
    this.new_currentRound = {
      ...this.new_game.rounds[this.roundIndex],
      [Winner.Line]: {
        count: 1,
        tickets: [],
        from: 12,
        to: 16,
      },
      [Winner.Cross]: {
        count: 1,
        tickets: [],
        from: 20,
        to: 25,
      },
      [Winner.All]: {
        count: 1,
        tickets: [],
        from: 33,
        to: 39,
      }
    };
    this.new_currentRoundTickets = this.new_tickets.map((ticket) => {
      return {
        number: ticket.number,
        field: ticket.rounds[this.roundIndex].field,
      }
    });

  }

  handleClick(event: Event){
    event?.stopImmediatePropagation();
    if (!this.playerService.$init.value) {
      return;
    }
    if (this.playedSongs.length === this.roundSongs.length){
      this.roundIndex++;
      this.prepareRound();
    }
    this.handleStart();
  }

  handleStop(){
    this.showName = true;
    this.new_selectedSong!.played = true;
    if (this.new_winners.size ) {
      this.askWinner(this.new_winners);
    }
  }

  handleStart() {
    this.showName = false;
    this.currentStep++;
    this.deep = DEEP + Math.floor(this.currentStep / 10);
    this.new_selectedSong = null;
    const availableSongs = this.roundSongs.filter(song => !this.playedSongs.includes(song.id)).sort(() => Math.random() - 0.5);
    let randomizerIndex = 0;
    const randomizerInterval = setInterval(() => {
      this.roundSongs.forEach((song) => (song.class = ''));
      availableSongs[randomizerIndex++ % availableSongs.length].class = 'blue';
    }, this.new_simulation ? 0 : 250);

    const selectedSongId = this.selectSong();
    this.new_selectedSong = this.roundSongs.find(song => song.id === selectedSongId)!;
    const playPromise = this.new_simulation ? Promise.resolve() : this.playerService.play(this.new_selectedSong);
    playPromise.then(this.handleStop.bind(this));

    setTimeout(() => {
      clearInterval(randomizerInterval);
      this.roundSongs.forEach((song) => (song.class = ''));
      this.new_selectedSong!.class = 'green';
    }, this.new_simulation ? 0 : environment.playerDelay * 1000 - 500);
    this.new_winners = this.getWinners(selectedSongId);
    this.playedSongs.push(selectedSongId);
  }



  get playingTickets () {
    return this.new_currentRoundTickets.filter(ticket => !this.wastedTickets.includes(ticket.number));
  }

  get roundSongs() {
    return this.new_currentRound?.field.flat() || [];
  }

  selectSong(): string{
    const weights = this.getWeights();
    const selectedWeight = weights.sort((a, b) => b.weight - a.weight)[0];
    return selectedWeight.songId;
  }

  getWinners(selectedSongId: string,playedSongs?: string[]): Set<number>{
    return this.playingTickets.reduce((result, ticket) => {
      const isWinner = this.trySongInTicket(selectedSongId, ticket, playedSongs ?? this.playedSongs)
      if (isWinner) {
        result.add(ticket.number)
      }
      return result;
    }, new Set<number>);
  }

  getWeights(): Weight[] {
    const weights = [];
    const songs = this.new_currentRound!.field.flat().map(song => song.id).filter(songId => !this.playedSongs.includes(songId)).sort(() => Math.random() - 0.5);
    for (const songId of songs) {
      const weight = this.getWeightsForSong(songId, songs, this.playedSongs);
      weights.push({ songId, weight })
    }
    return weights;
  }

  getWeightsForSong(songId: string, songs: string[], playedSongs: string[]): number {
    if (this.currentStep <= 7 || this.wantedWinner == null || this.deep === 0) {
      return 1;
    }
    const restOfSongs = songs.filter(song => song !== songId);
    if ( !songs.length) {
      return -this.boost;
    }
    const winners = this.getWinners(songId, playedSongs);
    const step = this.currentStep + (DEEP - this.deep)
    const weight = this.getResultWeight(winners, step);
    if(weight != null){
      return weight;
    }

    let success = 0;
    const level = this.deep;
    --this.deep;
    for (const subSongId of restOfSongs) {
      const weight = this.getWeightsForSong(subSongId, restOfSongs, [...playedSongs, songId]);
      success += weight;
    }
    this.deep = level;
    return success / songs.length;
  }

  askWinner(winners: Set<number>){
    const winnerQuestion = `Билет${winners.size > 1 ? 'ы' : ''} #${Array.from(winners).join(', ')} собрал${winners.size > 1 ? 'и' : ''} ${WIN_NAMING[this.wantedWinner!]}. Билет в игре?`;
    this.modalService.openModal(winnerQuestion).then(answer => {
      if(answer){
        this.submitWin();
      }
    });
  }

  submitWin(){
    console.log(`Билеты № ${Array.from(this.new_winners)} выиграли ${WIN_NAMING[this.wantedWinner!]} в ${this.new_currentRound!.name} на ${this.currentStep} ходу`);
    this.wantedWinner = this.wantedWinner === Winner.Line ? Winner.Cross : this.wantedWinner === Winner.Cross ? Winner.All : null;
    this.winnersNumbers.push(...Array.from(this.new_winners));
  }

  getResultWeight(winners: Set<number>, step: number): number | null {
    const winnersArray = Array.from(winners);
    const { count, tickets } = this.new_currentRound![this.wantedWinner!];
    if (winnersArray.length > count || winnersArray.some(winner => this.winnersNumbers.includes(winner))) {
      return -this.boost * 10;
    }
    // if (winners.length > count) {
    //   return -this.boost * 1000;
    // }
    if(tickets.length && winnersArray.length === count && winnersArray.every(winner => tickets.includes(winner))){
      return this.boost * 1000;
    }
    if (winnersArray.length === count){
      let result = this.boost--;
      if (this.boost === 501) {
        this.boost = 1000;
      }
      return result;
    }
    return null
  }

  trySongInTicket(songId: string, ticket: NEW_IPlayingTicketRound, playedSongs: string[]): boolean {
    let result = false;
    const linesSimulation = ticket.field.map(
      (row) => new Set(row.filter(song => !playedSongs.includes(song.id)).map((song) => song.id))
    );
    for (let columnIndex = 0; columnIndex < ticket.field.length; columnIndex++) {
      linesSimulation.push(new Set(ticket.field.filter(row => !playedSongs.includes(row[columnIndex].id)).map((row) => row[columnIndex].id)));
    }
    const horizontalLines = linesSimulation.slice(0, linesSimulation.length / 2);
    const verticalLines = linesSimulation.slice(linesSimulation.length / 2);
    const verticalWin = verticalLines.some(line => line.has(songId) && line.size === 1);
    const horizontalWin = horizontalLines.some(line => line.has(songId) && line.size === 1);
    if (this.wantedWinner === Winner.Line && (verticalWin || horizontalWin)) {
      result = true;
    }
    if (this.wantedWinner === Winner.Cross && (verticalWin && horizontalWin)) {
      result = true;
    }
    if (this.wantedWinner === Winner.All) {
      const rest = new Set([...verticalLines, ...horizontalLines].map(s => [...s]).flat());
      if (rest.has(songId) && rest.size === 1) {
        result = true;
      }
    }
    return result;
  }

  rightClick(event: Event) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }


  showExample() {
    const video = {
      name: '',
      duration: 8,
      number: 1,
      start: 0,
      played: false,
      class: '',
      id: 'Hy8kmNEo1i8',
    };

    // this.playerService.$video.next(video);
  }


}

const settings: IGameSettings = {
  doubleWin: false,
  logo: 'weli',
  rounds: [
    {
      roundFieldColumns: 7,
      roundFieldRows: 6,
      playerFieldColumns: 5,
      playerFieldRows: 5,
      lineWinners: 1,
      crossWinners: 1,
      allWinners: 1,
      doubleWin: false,
      notRusSongs: 6,
    },
    {
      roundFieldColumns: 7,
      roundFieldRows: 6,
      playerFieldColumns: 5,
      playerFieldRows: 5,
      lineWinners: 1,
      crossWinners: 1,
      allWinners: 1,
      doubleWin: false,
      notRusSongs: 6,
    },
  ],
};

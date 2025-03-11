import { Component, OnDestroy } from '@angular/core';
import {
  IGameSettings,
  IGame,
  IPlayingTicket,
  IRound,
  IRoundSong,
  ITicket,
  SocketMessageType,
  TicketsMessagePayload,
  Weight,
  Winner,
} from '../../models/models';
import { PlayerService } from '../../services/player.service';
import { environment } from '../../../environments/environment';
import { StateService } from '../../services/state.service';
import { CreatorService } from '../../services/creator.service';
import { getRandomElem } from '../../utils/utils';
import { ModalService } from '../../services/modal.service';
import { SocketService } from '../../services/socket.service';
import { DialogService } from '../../services/dialog.service';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { LoadingService } from '../../services/loading.service';
import { ApiService } from '../../services/api.service';

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
export class GameComponent implements OnDestroy{
  public isGameStarted = false;
  public showName = false;
  time = 0;
  deep = DEEP;
  boost = 1000;
  errors = 0;
  game!: IGame;
  currentRound!: IRound;
  currentRoundTickets: IPlayingTicket[] = [];
  selectedSong: IRoundSong | null = null;
  playedSongs: string[] = [];
  currentWinners: Set<number> = new Set();
  simulation = true;
  tickets: ITicket[] = [];
  $init = new Subject<boolean>();
  block = false;
  testPeriod = 15;
  isPlayed = false;


  constructor(
    private playerService: PlayerService,
    public stateService: StateService,
    private creatorService: CreatorService,
    private modalService: ModalService,
    private socketService: SocketService,
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private loadingService: LoadingService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.init()
  }

  async init(){
    this.stateService.showHome = false;
    let code = this.route.snapshot.params['code'];
    if(!code){
      const codeField = { id: 'code', label: '', control: new FormControl('', [Validators.required]) };
      code = await this.dialogService.init({
        message: 'Введите код игры',
        fields: [codeField],
        buttons: [{
          label: 'Ок',
          disabled: () => codeField.control.invalid,
          action: () => codeField.control.value as string,
        },
        {
          label: 'Выход',
          disabled: () => false,
          action: () => null,
          class: 'cancel'
        }
        ]
      })
      this.router.navigate(code != null ? ['game/', code] : ['']);
      return;
    }
    this.loadingService.show()
    const game = await this.apiService.getGame(code);
    this.loadingService.hide()
    if(game == null){
      this.router.navigate([''])
      return;
    }
    this.game = game!;
    this.stateService.gameCode = this.game.code;
    this.loadingService.show()
    this.tickets = await this.apiService.getTickets(this.game.id);
    this.loadingService.hide();
    const countField = { id: 'count', type: 'number', label: '', control: new FormControl<number>(16, [Validators.required]) };
    if(!game.results.lastStart){
      const ticketsCount = await this.dialogService.init({
        message: 'Сколько билетов в игре?',
        fields: [countField],
        buttons: [{
          label: 'Ок',
          disabled: () => countField.control.invalid,
          action: async () => {
            return Number(countField.control.value);
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
      if(!ticketsCount) {
        this.router.navigate([''])
        return;
      }
      this.game.results.wastedTickets = this.tickets.map(ticket => ticket.number).filter(number => number > ticketsCount);
      this.saveResults();
    }
    if(this.game.testGame){
      this.dialogService.popUp({message: `Это тестовая игра. Вы сможете сделать ${this.testPeriod} ходов`});
    }
    this.playerService.gameMode = true;
    this.playerService.playBackGround(this.game.backgroundMusic);
    this.socketService.onMessage<boolean | null>(SocketMessageType.Player, ({data}) => {
      if(data === true ){
        this.nextSong();
      } else if(data === false && this.block){
        this.playerService.stop();
      }
    });
    this.socketService.onMessage<TicketsMessagePayload>(SocketMessageType.Tickets, ({data}) => {
      const existedNumbers = this.currentRoundTickets.map(t => t.number)
      const wastedTickets = [...this.game.results.wastedTickets];
      this.game.results.wastedTickets.length = 0;
      if(data.exclude){
        this.game.results.wastedTickets.push(...Array.from(new Set([...wastedTickets, ...data.tickets])).filter(num => existedNumbers.includes(num)).sort());
      } else {
        this.game.results.wastedTickets.push(...wastedTickets.filter(ticket => !data.tickets.includes(ticket)).sort())
      }
      this.saveResults();
    });
    this.socketService.onMessage<TicketsMessagePayload>(SocketMessageType.Game, () => {
      if(this.game.results.currentStep === 0){
        this.startRound();
      }
    });
    this.$init.next(true)
  }

  simulateGames(count: number) {
    for (let index = 0; index < count; index++) {
      this.simulateNewGame();
      console.log(`${this.errors}/${(index + 1)*2}`)
    }
  }

  simulateNewGame() {
    // this.game = this.creatorService.generateGame();


    for (let i = 0; i < this.game.rounds.length; i++) {
      this.game.results.currentRoundIndex = i;
      this.simulateRound();
    }
  }

  simulateRound() {
    this.startRound();
    console.log('players ', this.currentRoundTickets.length -  this.game.results.wastedTickets.length);
    this.simulateStep();
  }


  simulateStep(){
    this.game.results.currentStep++;
    this.deep = DEEP + Math.floor(this.game.results.currentStep / 10);
    const selectedSongId = this.selectSong();
    this.currentWinners = this.getWinners(selectedSongId);
    this.playedSongs.push(selectedSongId);

    if (this.game.results.wantedWinner && this.currentWinners.size > (this.currentRound[this.game.results.wantedWinner].count || 99)) {
      this.errors++
    }
    if(this.currentWinners.size){
      this.submitWin();
    }
    if(this.playedSongs.length < this.roundSongs.length){
      this.simulateStep();
    }
  }

  startRound() {
    this.showName = false;
    this.block = false;
    this.playedSongs = this.game.results.rounds[this.game.results.currentRoundIndex].playedSongs;
    this.currentRound = this.game.rounds[this.game.results.currentRoundIndex];
    this.currentRoundTickets = this.tickets.map((ticket) => {
      return {
        number: ticket.number,
        field: ticket.rounds[this.game.results.currentRoundIndex].field,
      }
    });
    this.roundSongs.forEach(song => {
      if(this.playedSongs.includes(song.youtubeId)){
        song.played = true;
      }
    } )
    this.isGameStarted = true;
  }

  handleClick(event: Event){
    event?.stopImmediatePropagation();
    this.nextSong();
  }

  nextSong() {
    if(this.block) {
      return;
    }
    this.block = true;
    if (!this.playerService.$init.value) {
      return;
    }
    if (this.playedSongs.length === this.roundSongs.length){
      this.isGameStarted = false;
      this.game.results.currentRoundIndex++
      this.game.results.currentStep = 0;
      this.game.results.wantedWinner = Winner.Line;
      this.saveResults();
      return;
    }
    this.handleStart();
  }

  saveResults(){
    const {id, results} = this.game;
    this.apiService.updateGame({id, results})
  }

  handleStop(){
    this.showName = true;
    this.selectedSong!.played = true;
    if (this.currentWinners.size ) {
      this.askWinner(this.currentWinners);
    } else {
      this.saveResults();
    }
    this.block = false;
  }

  handleStart() {
    console.log(this.game.results.wastedTickets);
    if(!this.isPlayed){
      this.markAsPlayed();
    }
    this.showName = false;
    if(this.game.testGame && this.game.results.currentStep === this.testPeriod){
      this.dialogService.popUp({message: 'Это была тестовая игра'});
      this.router.navigate(['']);
      return;
    }
    this.game.results.currentStep++;
    this.deep = DEEP + Math.floor(this.game.results.currentStep / 10);
    this.selectedSong = null;
    const availableSongs = this.roundSongs.filter(song => !this.playedSongs.includes(song.youtubeId)).sort(() => Math.random() - 0.5);
    let randomizerIndex = 0;
    const randomizerInterval = setInterval(() => {
      this.roundSongs.forEach((song) => (song.class = ''));
      availableSongs[randomizerIndex++ % availableSongs.length].class = 'blue';
    }, this.simulation ? 0 : 250);

    const selectedSongId = this.selectSong();
    this.selectedSong = this.roundSongs.find(song => song.youtubeId === selectedSongId)!;
    const playPromise = this.simulation ? Promise.resolve() : this.playerService.play(this.selectedSong);
    playPromise.then(this.handleStop.bind(this));

    setTimeout(() => {
      clearInterval(randomizerInterval);
      this.roundSongs.forEach((song) => (song.class = ''));
      this.selectedSong!.class = 'green';
    }, this.simulation ? 0 : environment.playerDelay * 1000 - 500);
    this.currentWinners = this.getWinners(selectedSongId);
    this.playedSongs.push(selectedSongId);
  }

  markAsPlayed(){
    this.isPlayed = true;
    const now = new Date();
    this.game.results.lastStart = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}: ${now.getMinutes()}`;
    this.saveResults();
  }

  get playingTickets () {
    return this.currentRoundTickets.filter(ticket => !this.game.results.wastedTickets.includes(ticket.number));
  }

  get roundSongs() {
    return this.currentRound.field.flat();
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
    const songs = this.currentRound.field.flat().map(song => song.youtubeId).filter(songId => !this.playedSongs.includes(songId)).sort(() => Math.random() - 0.5);
    for (const songId of songs) {
      const weight = this.getWeightsForSong(songId, songs, this.playedSongs);
      weights.push({ songId, weight })
    }
    return weights;
  }

  getWeightsForSong(songId: string, songs: string[], playedSongs: string[]): number {
    if (this.game.results.currentStep <= 7 || this.game.results.wantedWinner == null || this.deep === 0) {
      return 1;
    }
    const restOfSongs = songs.filter(song => song !== songId);
    if ( !songs.length) {
      return -this.boost;
    }
    const currentWinners = this.getWinners(songId, playedSongs);
    const step = this.game.results.currentStep + (DEEP - this.deep)
    const weight = this.getResultWeight(currentWinners, step);
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

  askWinner(currentWinners: Set<number>){
    const winnerQuestion = `Билет${currentWinners.size > 1 ? 'ы' : ''} #${Array.from(currentWinners).join(', ')} собрал${currentWinners.size > 1 ? 'и' : ''} ${WIN_NAMING[this.game.results.wantedWinner!]}. Билет в игре?`;
    this.modalService.openModal(winnerQuestion).then(answer => {
      if(answer){
        this.submitWin();
      }
    }).finally(() => this.saveResults());
  }

  submitWin(){
    console.log(`Билеты № ${Array.from(this.currentWinners)} выиграли ${WIN_NAMING[this.game.results.wantedWinner!]} в ${this.currentRound.name} на ${this.game.results.currentStep} ходу`);
    this.game.results.wantedWinner = this.game.results.wantedWinner === Winner.Line ? Winner.Cross : this.game.results.wantedWinner === Winner.Cross ? Winner.All : null;
    this.game.results.gameWinners.push(...Array.from(this.currentWinners));
  }

  getResultWeight(currentWinners: Set<number>, step: number): number | null {
    const winnersArray = Array.from(currentWinners);
    const { count, tickets } = this.currentRound[this.game.results.wantedWinner!];
    if (winnersArray.length > count || winnersArray.some(winner => this.game.results.gameWinners.includes(winner))) {
      return -this.boost * 10;
    }
    // if (currentWinners.length > count) {
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

  trySongInTicket(songId: string, ticket: IPlayingTicket, playedSongs: string[]): boolean {
    let result = false;
    const linesSimulation = ticket.field.map(
      (row) => new Set(row.filter(song => !playedSongs.includes(song.youtubeId)).map((song) => song.youtubeId))
    );
    for (let columnIndex = 0; columnIndex < ticket.field.length; columnIndex++) {
      linesSimulation.push(new Set(ticket.field.filter(row => !playedSongs.includes(row[columnIndex].youtubeId)).map((row) => row[columnIndex].youtubeId)));
    }
    const horizontalLines = linesSimulation.slice(0, linesSimulation.length / 2);
    const verticalLines = linesSimulation.slice(linesSimulation.length / 2);
    const verticalWin = verticalLines.some(line => line.has(songId) && line.size === 1);
    const horizontalWin = horizontalLines.some(line => line.has(songId) && line.size === 1);
    if (this.game.results.wantedWinner === Winner.Line && (verticalWin || horizontalWin)) {
      result = true;
    }
    if (this.game.results.wantedWinner === Winner.Cross && (verticalWin && horizontalWin)) {
      result = true;
    }
    if (this.game.results.wantedWinner === Winner.All) {
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
      youtubeId: 'Hy8kmNEo1i8',
    };

    // this.playerService.$video.next(video);
  }

  ngOnDestroy(): void {
    this.playerService.gameMode = false;
    this.stateService.showHome = true;
    this.playerService.stopBackGround();
  }

}

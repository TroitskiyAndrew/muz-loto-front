import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from './api.service';
import { CreatorService } from './creator.service';
import { DialogService } from './dialog.service';
import { LoadingService } from './loading.service';
import { ModalService } from './modal.service';
import { PlayerService } from './player.service';
import { SocketService } from './socket.service';
import { StateService } from './state.service';
import {
  GameMessagePayload,
  GameMessageType,
  IGame,
  IGameServiceInitParams,
  IRoundSong,
  IRoundTicket,
  IStepResults,
  IStepResultsMessagePayload,
  ISubmitWinnersResults,
  ITicket,
  SocketMessageType,
  Weight,
  Winner,
} from '../models/models';
import {
  BASE_DEEP,
  RANDOMIZER_DURATION_STEP,
  DELAY_BEFORE_PLAYING,
  TEST_PERIOD,
  WIN_NAMING,
  getDefaultResults,
} from '../constants/constants';
import { FormControl, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class GameService implements OnDestroy {
  game!: IGame;
  tickets: ITicket[] = [];
  playingMode = false;
  isFront = false;
  blockActions = false;
  roundTickets: IRoundTicket[] = [];
  selectedSong: IRoundSong | null = null;
  selectedSongId = '';
  deep = BASE_DEEP;
  boost = 1000;
  showQuestionOnFront = true;
  dialogId = 0;
  isFirstStep = true;
  isSongPlaying = false;
  isDialogOpen = false;

  silentMode = true;
  simulation = false;
  simulationAttempt = 1;
  simulationCount = 10;

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
  ) {}

  async init(params: IGameServiceInitParams): Promise<IGame | null> {
    this.isFront = params.isFront;
    this.isDialogOpen = false;
    this.isFirstStep = true;
    this.playingMode = false;
    this.blockActions = false;
    const game =
      params.game ?? (await this.apiService.getGame(params.code || ''));
    if (!game) {
      return null;
    }
    this.game = game;
    this.tickets = await this.apiService.getTickets(this.game.id);
    this.stateService.gameCode = this.game.code;
    if (!game.results.playingTicketsAsked && !this.isFront) {
      this.sendAskPlayingTicketsCountMessage();
    }
    if (this.game.results.stepWinners.length) {
      this.sendAskWinnerMessage();
    }
    this.socketService.onMessage<GameMessagePayload>(
      SocketMessageType.Game,
      ({ data }) => {
        switch (data.type) {
          case GameMessageType.AskPlayingTicketsCount:
            if(!this.isFront){
              this.askPlayingTicketsCount();
            }
            this.blockActions = true;
            break;
          case GameMessageType.AnswerPlayingTicketsCount:
            this.answerPlayingTicketsChanges(data.count);
            this.dialogService.acceptResult({
              dialogId: this.dialogId,
              result: null,
            });
            break;
          case GameMessageType.AskWinners:
            this.askWinner();
            break;
          case GameMessageType.AnswerWinners:
            this.answerWinnersChanges();
            this.dialogService.acceptResult({
              dialogId: this.dialogId,
              result: null,
            });
            break;
          case GameMessageType.StartRound:
            this.startRound(data.roundIndex);
            break;
          case GameMessageType.StopRound:
            this.stopRoundChanges(data.next);
            break;
          case GameMessageType.StartStep:
            this.startStepChanges(data as IStepResultsMessagePayload);
            break;
          case GameMessageType.FinishStep:
            this.finishStepChanges();
            break;

          default:
            break;
        }
      }
    );
    return game;
  }

  sendAskPlayingTicketsCountMessage() {
    this.socketService.askPlayingTicketsCount();
    this.askPlayingTicketsCount();
    this.isDialogOpen = true;
  }

  private askPlayingTicketsCount() {
    this.blockActions = true;
    if (this.isDialogOpen) {
      return;
    }

    const countField = {
      id: 'count',
      type: 'number',
      label: '',
      control: new FormControl<number>(this.game.ticketsCount, [
        Validators.required,
        Validators.min(1),
        Validators.max(this.game.ticketsCount),
      ]),
    };

    this.dialogService
      .init({
        init: (dialogId) => (this.dialogId = dialogId!),
        disableClose: true,
        message: 'Сколько билетов в игре?',
        fields: [countField],
        buttons: [
          {
            label: 'Ок',
            disabled: () => countField.control.invalid,
            action: async () => {
              return Number(countField.control.value);
            },
          },
          {
            label: 'Отмена',
            disabled: () => false,
            action: () => false,
            class: 'cancel',
          },
        ],
      })
      .then((playersCount: number | false | null) => {
        if (playersCount === false) {
          this.router.navigate(['']);
        } else if (playersCount) {
          this.sendPlayingTicketsMessage(playersCount);
        }
        this.blockActions = false;
      });
  }

  sendPlayingTicketsMessage(ticketsCount: number) {
    this.socketService.answerPlayingTickets(ticketsCount);
    this.answerPlayingTickets(ticketsCount);
    this.isDialogOpen = false;
  }

  answerPlayingTicketsChanges(result: number) {
    this.blockActions = false;
    this.playingTicketsNumbers = this.tickets
      .map((ticket) => ticket.number)
      .filter((number) => number <= result);
    this.results.playingTicketsAsked = true;
  }

  answerPlayingTickets(result: number) {
    this.answerPlayingTicketsChanges(result);
    this.saveResults();
  }

  sendAskWinnerMessage() {
    this.socketService.askWinners();
    this.askWinner();
    this.isDialogOpen = true;
  }
  private askWinner() {
    this.blockActions = true;
    if (this.isDialogOpen) {
      return;
    }

    if (this.isFront && !this.showQuestionOnFront) {
      return;
    }
    const message = `Билет${
      this.stepWinners.length > 1 ? 'ы' : ''
    } #${this.stepWinners.join(', ')} собрал${
      this.stepWinners.length > 1 ? 'и' : ''
    } ${WIN_NAMING[this.wantedWinner!]}. Билет в игре?`;
    this.dialogService
      .init({
        init: (dialogId) => (this.dialogId = dialogId!),
        disableClose: true,
        message,
        buttons: [
          {
            label: 'Да',
            disabled: () => false,
            action: () => true,
          },
          {
            label: 'Нет',
            disabled: () => false,
            action: () => false,
            class: 'cancel',
          },
        ],
      })
      .then((res: boolean | null) => {
        if (res === null) {
          return;
        }
        this.sendWinnerAnswerMessage(res);
      });
  }

  sendWinnerAnswerMessage(answer: boolean) {
    this.socketService.answerWinners();
    this.answerWinners(answer);
    this.isDialogOpen = false;
  }

  answerWinnersChanges() {
    this.blockActions = false;
  }

  answerWinners(result: boolean) {
    this.answerWinnersChanges();
    const results = this.getSubmitWinnersResult(result);
    this.sendSubmitWinnersMessage(results);
  }

  sendSubmitWinnersMessage(results: ISubmitWinnersResults) {
    this.socketService.submitWin(results);
    this.submitWin(results);
  }

  getSubmitWinnersResult(result: boolean): ISubmitWinnersResults {
    if (!result) {
      return { wantedWinner: this.wantedWinner, newWinners: [] };
    }
    return {
      wantedWinner:
        this.wantedWinner === Winner.Line
          ? Winner.Cross
          : this.wantedWinner === Winner.Cross
          ? Winner.All
          : null,
      newWinners: this.stepWinners,
    };
  }

  submitWinnersChanges(results: ISubmitWinnersResults) {
    const logWinner = results.wantedWinner ? results.wantedWinner - 1 : 2
    console.log(
      `Билеты № ${results.newWinners} выиграли ${
        // @ts-ignore
        WIN_NAMING[logWinner]
      } в ${this.playingRound.name} на ${this.results.currentStep} ходу`
    );
    this.results.gameWinners.push(...results.newWinners);
    this.stepWinners = [];
    this.wantedWinner = results.wantedWinner;
  }

  submitWin(results: ISubmitWinnersResults) {
    if(results.newWinners.length){
      this.submitWinnersChanges(results);
      this.saveResults();
    }
  }

  saveResults() {
    const { id, results } = this.game;
    if(this.simulation){
      return;
    }
    this.apiService.updateGame({ id, results });
  }

  sendStartRoundMessage(roundIndex?: number) {
    roundIndex = roundIndex || this.results.currentRoundIndex;
    this.socketService.startRound(roundIndex);
    this.startRound(roundIndex);
    this.saveResults();
  }

  startRound(roundIndex: number) {
    const preparation = this.prepareRound(roundIndex);
    if (!preparation) {
      return;
    }
    if (!this.results.playingTicketsAsked && this.isFront) {
      if(!this.simulation){
        this.sendAskPlayingTicketsCountMessage();
      } else {
        this.sendPlayingTicketsMessage(20);
      }
    }
    this.playingMode = true;
  }

  prepareRound(roundIndex: number): boolean {
    if (roundIndex >= this.game.rounds.length) {
      return false;
    }
    this.blockActions = false;
    this.results.currentRoundIndex = roundIndex;
    this.roundTickets = this.tickets.map((ticket) => {
      return {
        number: ticket.number,
        field: ticket.rounds[this.results.currentRoundIndex].field,
      };
    });
    this.playedSongs.forEach(
      (playedSongId) => (this.roundSongsMap.get(playedSongId)!.played = true)
    );
    return true;
  }

  sendStopRoundMessage(next: boolean) {
    this.socketService.stopRound(next);
    this.stopRound(next);
  }

  stopRoundChanges(next:boolean) {
    this.playingMode = false;
    this.selectedSong = null;
    if (next) {
      this.results.currentRoundIndex++;
      this.results.currentStep = 0;
    }
  }

  stopRound(next: boolean) {
    this.stopRoundChanges(next);
    if(next){
      this.saveResults();
    }
  }

  sendStartStepMessage(results: IStepResults) {
    if (this.game.testGame && this.results.currentStep === TEST_PERIOD) {
      this.dialogService
        .popUp({ message: 'Это была тестовая игра', disableClose: true })
        .then(() => this.router.navigate(['']));
      return;
    }

    this.socketService.startStep(results);
    this.startStep(results);
  }

  startStepChanges(results: IStepResults) {
    this.blockActions = true;
    this.isSongPlaying = true;
    if (this.selectedSong) {
      this.selectedSong.class = '';
    }
    this.selectedSong = null;
    this.selectedSongId = results.selectedSongId;
    this.results.currentStep++;
    this.playedSongs.push(results.selectedSongId);
    this.stepWinners = results.stepWinners;
    if(results.newLastStart){
      this.results.lastStart = results.newLastStart;
    }
  }

  startStep(results: IStepResults) {
    this.startStepChanges(results);
    this.saveResults();
  }

  makeStep() {
    if (this.blockActions) {
      return;
    }
    if (this.results.currentStep === this.roundSongs.length) {
      this.sendStopRoundMessage(true);
      if(this.simulation && this.playingRound){
        this.sendStartRoundMessage();
        this.makeStep();
      }
      return;
    }
    let newLastStart = '';
    if (this.isFirstStep) {
      this.isFirstStep = false;
      newLastStart = this.getLastStart();
    }
    const selectedSongId = this.selectSong();

    const stepWinners = this.getWinners(selectedSongId, this.playedSongs);

    this.sendStartStepMessage({ stepWinners, selectedSongId, newLastStart });
    if (!this.simulation && !this.silentMode) {
      this.showRandomAndPlaySong();
    }

    if (this.simulation || this.silentMode) {
      this.sendFinishStepMessage(true);
    }
  }

  showRandomAndPlaySong() {
    const randomAvailableSongs: string[] = [];
    const availableSongsIds = [...this.availableSongsIds, this.selectedSongId]
    while (
      randomAvailableSongs.length <
      DELAY_BEFORE_PLAYING / RANDOMIZER_DURATION_STEP
    ) {
      randomAvailableSongs.push(
        ...availableSongsIds.sort(() => Math.random() - 0.5)
      );
    }
    this.socketService.playSong(this.selectedSongId, randomAvailableSongs);
  }

  selectSong(): string {
    const deep = BASE_DEEP + Math.floor(this.results.currentStep / 10);
    this.deep = deep;
    const weights = this.getWeights(deep);
    const selectedWeight = weights.sort((a, b) => b.weight - a.weight)[0];
    return selectedWeight.songId;
  }

  getWeights(deep: number): Weight[] {
    const weights = [];
    const songs = this.availableSongsIds.sort(() => Math.random() - 0.5);
    for (const songId of songs) {
      const weight = this.getWeightsForSong(
        songId,
        songs,
        this.playedSongs,
        deep
      );
      weights.push({ songId, weight });
    }
    return weights;
  }

  getWeightsForSong(
    songId: string,
    songs: string[],
    playedSongs: string[],
    deep: number
  ): number {
    if (
      this.results.currentStep <= 7 ||
      this.results.wantedWinner == null ||
      deep === 0
    ) {
      return 1;
    }
    const restOfSongs = songs.filter((song) => song !== songId);
    if (!songs.length) {
      return -this.boost;
    }
    const currentWinners = this.getWinners(songId, playedSongs);
    const step = this.results.currentStep + (this.deep - deep);
    const weight = this.getResultWeight(currentWinners, step);
    if (weight != null) {
      return weight;
    }

    let success = 0;
    --deep;
    for (const subSongId of restOfSongs) {
      const weight = this.getWeightsForSong(
        subSongId,
        restOfSongs,
        [...playedSongs, songId],
        deep
      );
      success += weight;
    }
    return success / songs.length;
  }

  getWinners(selectedSongId: string, playedSongs: string[]): number[] {
    return this.roundTickets.reduce((result, ticket) => {
      const isWinner = this.trySongInTicket(
        selectedSongId,
        ticket,
        playedSongs
      );
      if (isWinner) {
        result.push(ticket.number);
      }
      return result;
    }, [] as number[]);
  }

  trySongInTicket(
    songId: string,
    ticket: IRoundTicket,
    playedSongs: string[]
  ): boolean {
    let result = false;
    const linesSimulation = ticket.field.map(
      (row) =>
        new Set(
          row
            .filter((song) => !playedSongs.includes(song.id))
            .map((song) => song.id)
        )
    );
    for (
      let columnIndex = 0;
      columnIndex < ticket.field.length;
      columnIndex++
    ) {
      linesSimulation.push(
        new Set(
          ticket.field
            .filter((row) => !playedSongs.includes(row[columnIndex].id))
            .map((row) => row[columnIndex].id)
        )
      );
    }
    const horizontalLines = linesSimulation.slice(
      0,
      linesSimulation.length / 2
    );
    const verticalLines = linesSimulation.slice(linesSimulation.length / 2);
    const verticalWin = verticalLines.some(
      (line) => line.has(songId) && line.size === 1
    );
    const horizontalWin = horizontalLines.some(
      (line) => line.has(songId) && line.size === 1
    );
    if (
      this.results.wantedWinner === Winner.Line &&
      (verticalWin || horizontalWin)
    ) {
      result = true;
    }
    if (
      this.results.wantedWinner === Winner.Cross &&
      verticalWin &&
      horizontalWin
    ) {
      result = true;
    }
    if (this.results.wantedWinner === Winner.All) {
      const rest = new Set(
        [...verticalLines, ...horizontalLines].map((s) => [...s]).flat()
      );
      if (rest.has(songId) && rest.size === 1) {
        result = true;
      }
    }
    return result;
  }

  getResultWeight(currentWinners: number[], step: number): number | null {
    const winnersArray = Array.from(currentWinners);
    const { count, tickets } = this.playingRound[this.wantedWinner!];
    if (
      winnersArray.length > count ||
      winnersArray.some((winner) => this.results.gameWinners.includes(winner))
    ) {
      return -this.boost * 10;
    }

    if (
      tickets.length &&
      winnersArray.length === count &&
      winnersArray.every((winner) => tickets.includes(winner))
    ) {
      return this.boost * 1000;
    }
    if (winnersArray.length === count) {
      let result = this.boost--;
      if (this.boost === 501) {
        this.boost = 1000;
      }
      return result;
    }
    return null;
  }

  sendFinishStepMessage(fromPlayer: boolean) {
    this.socketService.finishStep();
    if (!fromPlayer) {
      this.socketService.stopSong();
    }
    this.finishStep();
  }

  finishStepChanges() {
    setTimeout(() => {
      this.isSongPlaying = false;
      this.blockActions = false;
    }, 50);

    this.selectedSong = this.roundSongsMap.get(
      this.selectedSongId
    ) as IRoundSong;
    this.selectedSong.played = true;
  }

  finishStep() {
    this.finishStepChanges();
    if (this.stepWinners.length) {
      if(!this.simulation){
        this.sendAskWinnerMessage();
      } else {
        const result = !this.stepWinners.some(winner => !this.playingTicketsNumbers.includes(winner));
        this.sendWinnerAnswerMessage(result);
      }
    }
    if (this.results.currentStep === this.roundSongs.length) {
      this.sendStopRoundMessage(true);
      if(this.simulation){
        if (this.playingRound){
          this.sendStartRoundMessage();
          this.makeStep();
        } else if(this.simulationAttempt <= this.simulationCount) {
          console.log(this.simulationAttempt)
          this.simulationAttempt++;
          this.game.results = getDefaultResults(this.game.rounds.length);
          this.sendStartRoundMessage();
          this.makeStep();
        }
        return;
      }
    }
    if(this.simulation){
      setTimeout(() => this.makeStep(), 100);
    }
  }

  sendNewPlayingTicketsMessage(newPlayingTickets: number[]){
    this.socketService.changePlayingTickets(newPlayingTickets);
    this.newPlayingTicketsChanges(newPlayingTickets);


  }

  newPlayingTicketsChanges(newPlayingTickets: number[]){
    this.playingTicketsNumbers = newPlayingTickets;
  }

  getNewPlayingTickets(tickets: number[], add: boolean){
    return add
    ? Array.from(new Set([...this.playingTicketsNumbers, ...tickets]))
    : this.playingTicketsNumbers.filter(
        (ticket) => !tickets.includes(ticket)
      );
  }

  changePlayingTickets(tickets: number[], add: boolean) {
    const newPlayingTickets = this.getNewPlayingTickets(tickets, add)
    this.sendNewPlayingTicketsMessage(newPlayingTickets);
    this.saveResults();
  }

  get results() {
    return this.game.results;
  }

  get playingTicketsNumbers() {
    return this.results.playingTicketsNumbers;
  }

  set playingTicketsNumbers(numbers) {
    this.playingTicketsNumbers.length = 0;
    this.playingTicketsNumbers.push(...numbers);
    this.playingTicketsNumbers.sort((a, b) => a - b);
  }

  get playingTickets() {
    return this.roundTickets.filter(({ number }) =>
      this.results.playingTicketsNumbers.includes(number)
    );
  }

  get playedSongs() {
    return this.results.rounds[this.results.currentRoundIndex].playedSongs;
  }

  get playingRound() {
    return this.game.rounds[this.results.currentRoundIndex];
  }

  get roundSongs() {
    return this.playingRound.field.flat();
  }
  get roundSongsMap() {
    return new Map(this.roundSongs.map((song) => [song.id, song]));
  }

  get availableSongsIds() {
    return this.roundSongs
      .map((song) => song.id)
      .filter((songId) => !this.playedSongs.includes(songId));
  }

  get playingField() {
    return this.playingRound.field;
  }

  get wantedWinner() {
    return this.results.wantedWinner;
  }

  set wantedWinner(wantedWinner: Winner | null) {
    this.results.wantedWinner = wantedWinner;
  }

  get stepWinners() {
    return this.results.stepWinners;
  }

  set stepWinners(winners) {
    this.results.stepWinners.length = 0;
    this.results.stepWinners.push(...winners);
  }

  getLastStart() {
    const now = new Date();
    return `${this.addZero(now.getDate())}/${
      this.addZero(now.getMonth() + 1)
    }/${now.getFullYear()} ${this.addZero(now.getHours())}: ${this.addZero(now.getMinutes())}`;
  }

  private addZero(number: number): string{
    return number < 10 ? '0' : '' + number.toString();
  }

  isRoundFinished(game: IGame, roundIndex: number){
    return game.results.rounds[roundIndex].playedSongs.length === game.rounds[roundIndex].field.flat().length;
  }

  isGameFinished(game: IGame){
    return !game.rounds.some((_, index) => !this.isRoundFinished(game, index));
  }

  ngOnDestroy(): void {
    this.playerService.gameMode = false;
    this.socketService.unsubscribe(SocketMessageType.Game);
  }
}

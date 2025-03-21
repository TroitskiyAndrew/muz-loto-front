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
import { environment } from '../../environments/environment';
import { GameEngineService } from './game-engine.service';

@Injectable({
  providedIn: 'root',
})
export class GameService implements OnDestroy {
  game!: IGame;
  tickets: ITicket[] = [];
  playingMode = false;
  isFront = false;
  blockStartStep = false;
  blockStopStep = false;
  selectedSong: IRoundSong | null = null;
  selectedSongId = '';
  showQuestionOnFront = true;
  dialogId = 0;
  isFirstStep = true;
  isSongPlaying = false;
  isDialogOpen = false;

  silentMode = environment.silentMode;
  simulation = environment.simulation;
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
    private gameEngineService: GameEngineService,
    private apiService: ApiService,
    private router: Router
  ) {}

  async init(params: IGameServiceInitParams): Promise<IGame | null> {
    this.isFront = params.isFront;
    this.isDialogOpen = false;
    this.isFirstStep = true;
    this.playingMode = false;
    this.blockStartStep = false;
    this.isSongPlaying = false;
    const game =
      params.game ?? (await this.apiService.getGame(params.code || ''));
    if (!game) {
      return null;
    }
    this.game = game;
    this.tickets = await this.apiService.getTickets(this.game.id);
    this.stateService.gameCode = this.game.code;
    if (!game.results.playingTicketsNumbers.length && !this.isFront) {
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
            if (!this.isFront) {
              this.askPlayingTicketsCount();
            }
            this.blockStartStep = true;
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
          case GameMessageType.SubmitWinners:
            this.submitWinnersChanges(data);
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
          case GameMessageType.BlockStopStep:
            this.blockStopStep = data.block;
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
    this.blockStartStep = true;
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
        this.blockStartStep = false;
      });
  }

  sendPlayingTicketsMessage(ticketsCount: number) {
    this.socketService.answerPlayingTickets(ticketsCount);
    this.answerPlayingTickets(ticketsCount);
    this.isDialogOpen = false;
  }

  answerPlayingTicketsChanges(result: number) {
    this.blockStartStep = false;
    this.playingTicketsNumbers = this.tickets
      .map((ticket) => ticket.number)
      .filter((number) => number <= result);
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
    this.blockStartStep = true;
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
        this.sendWinnerAnswerMessage(res ? [] : this.stepWinners);
      });
  }

  sendWinnerAnswerMessage(wastedTickets: number[]) {
    this.socketService.answerWinners();
    this.answerWinners(wastedTickets);
    this.isDialogOpen = false;
  }

  answerWinnersChanges() {
    this.blockStartStep = false;
  }

  answerWinners(wastedTickets: number[]) {
    this.answerWinnersChanges();
    const results = this.getSubmitWinnersResult(wastedTickets);
    this.sendSubmitWinnersMessage(results);
  }

  sendSubmitWinnersMessage(results: ISubmitWinnersResults) {
    this.socketService.submitWin(results);
    this.submitWinnersChanges(results);
    this.saveResults();
  }

  getSubmitWinnersResult(wastedTickets: number[]): ISubmitWinnersResults {
    if (wastedTickets.length) {
      return { wantedWinner: this.wantedWinner, newWinners: [], wastedTickets };
    }
    return {
      wantedWinner: this.getNextWantedWinner(this.wantedWinner!),
      newWinners: this.stepWinners,
      wastedTickets: [],
    };
  }

  getNextWantedWinner(wantedWinner: Winner): Winner | null {
    if (wantedWinner === Winner.Line) {
      return this.playingRound[Winner.Cross]
        ? Winner.Cross
        : this.getNextWantedWinner(Winner.Cross);
    }
    if (wantedWinner === Winner.Cross) {
      return this.playingRound[Winner.All] ? Winner.All : null;
    }
    return null;
  }

  submitWinnersChanges(results: ISubmitWinnersResults) {
    const logWinner = results.wantedWinner ? results.wantedWinner - 1 : 2;
    console.log(
      `Билеты № ${results.newWinners} выиграли ${
        // @ts-ignore
        WIN_NAMING[logWinner]
      } в ${this.playingRound.name} на ${this.currentStep} ходу`
    );
    this.playingTicketsNumbers = this.playingTicketsNumbers.filter(
      (number) => !results.wastedTickets.includes(number)
    );
    this.results.gameWinners.push(...results.newWinners);
    this.stepWinners = [];
    this.wantedWinner = results.wantedWinner;
  }

  saveResults() {
    const { id, results } = this.game;
    if (this.simulation) {
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
    if (!this.results.playingTicketsNumbers.length && this.isFront) {
      if (!this.simulation) {
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
    this.blockStartStep = false;
    this.results.currentRoundIndex = roundIndex;
    this.playedSongs.forEach(
      (playedSongId) => (this.roundSongsMap.get(playedSongId)!.played = true)
    );
    return true;
  }

  sendStopRoundMessage(next: boolean) {
    this.socketService.stopRound(next);
    this.stopRound(next);
  }

  stopRoundChanges(next: boolean) {
    this.playingMode = false;
    this.selectedSong = null;
    if (next) {
      this.results.currentRoundIndex++;
    }
  }

  stopRound(next: boolean) {
    this.stopRoundChanges(next);
    if (next) {
      this.saveResults();
    }
  }

  sendStartStepMessage(results: IStepResults) {
    if (this.game.testGame && this.currentStep === TEST_PERIOD) {
      this.dialogService
        .popUp({ message: 'Это была тестовая игра', disableClose: true })
        .then(() => this.router.navigate(['']));
      return;
    }

    this.socketService.startStep(results);
    this.startStep(results);
  }

  startStepChanges(results: IStepResults) {
    this.blockStartStep = true;
    this.isSongPlaying = true;
    if (this.selectedSong) {
      this.selectedSong.class = '';
    }
    this.selectedSong = null;
    this.selectedSongId = results.selectedSongId;
    this.playedSongs.push(results.selectedSongId);
    this.stepWinners = results.stepWinners;
    if (results.newLastStart) {
      this.results.lastStart = results.newLastStart;
    }
  }

  startStep(results: IStepResults) {
    this.startStepChanges(results);
    this.saveResults();
  }

  makeStep() {
    if (this.blockStartStep) {
      return;
    }
    if (
      this.results.rounds[this.results.currentRoundIndex].playedSongs.length ===
      this.roundSongs.length
    ) {
      this.sendStopRoundMessage(true);
      if (this.simulation && this.playingRound) {
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
    const selectedSongId = this.gameEngineService.selectSong(
      [...this.playingTickets],
      [...this.results.gameWinners],
      this.wantedWinner !== null ? this.playingRound[this.wantedWinner]! : null,
      [...this.availableSongsIds],
      [...this.playedSongs],
      this.wantedWinner
    );
    const stepWinners = this.gameEngineService.getWinners(
      this.playingTickets,
      selectedSongId,
      this.playedSongs,
      this.wantedWinner
    );

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
    const availableSongsIds = [...this.availableSongsIds, this.selectedSongId];
    while (
      randomAvailableSongs.length <
      DELAY_BEFORE_PLAYING / RANDOMIZER_DURATION_STEP
    ) {
      randomAvailableSongs.push(
        ...availableSongsIds.sort(() => Math.random() - 0.5)
      );
    }
    this.socketService.playSong(this.selectedSongId, randomAvailableSongs);
    this.sendBlockStopStepMessage(true);
  }

  sendBlockStopStepMessage(block: boolean) {
    this.socketService.blockStopStep(block);
    this.blockStopStep = block;
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
      this.blockStartStep = false;
    }, 50);

    this.selectedSong = this.roundSongsMap.get(
      this.selectedSongId
    ) as IRoundSong;
    this.selectedSong.played = true;
  }

  finishStep() {
    this.finishStepChanges();
    if (this.stepWinners.length) {
      if (!this.simulation) {
        this.sendAskWinnerMessage();
      } else {
        this.sendWinnerAnswerMessage([]);
      }
    }
    if (
      this.results.rounds[this.results.currentRoundIndex].playedSongs.length ===
      this.roundSongs.length
    ) {
      this.sendStopRoundMessage(true);
      if (this.simulation) {
        if (this.playingRound) {
          this.sendStartRoundMessage();
          this.makeStep();
        } else if (this.simulationAttempt <= this.simulationCount) {
          console.log(this.simulationAttempt);
          this.simulationAttempt++;
          this.game.results = getDefaultResults(this.game.rounds);
          this.sendStartRoundMessage();
          this.makeStep();
        }
        return;
      }
    }
    if (this.simulation) {
      setTimeout(() => this.makeStep(), 100);
    }
  }

  sendNewPlayingTicketsMessage(newPlayingTickets: number[]) {
    this.socketService.changePlayingTickets(newPlayingTickets);
    this.newPlayingTicketsChanges(newPlayingTickets);
  }

  newPlayingTicketsChanges(newPlayingTickets: number[]) {
    this.playingTicketsNumbers = newPlayingTickets;
  }

  getNewPlayingTickets(tickets: number[], add: boolean) {
    return add
      ? Array.from(new Set([...this.playingTicketsNumbers, ...tickets]))
      : this.playingTicketsNumbers.filter(
          (ticket) => !tickets.includes(ticket)
        );
  }

  changePlayingTickets(tickets: number[], add: boolean) {
    const newPlayingTickets = this.getNewPlayingTickets(tickets, add);
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
    return this.tickets
      .filter(({ number }) =>
        this.results.playingTicketsNumbers.includes(number)
      )
      .map((ticket) => {
        return {
          number: ticket.number,
          field: ticket.rounds[this.results.currentRoundIndex].field,
        };
      });
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
    return this.results.rounds[this.results.currentRoundIndex].wantedWinner;
  }

  set wantedWinner(wantedWinner: Winner | null) {
    this.results.rounds[this.results.currentRoundIndex].wantedWinner =
      wantedWinner;
  }

  get stepWinners() {
    return this.results.stepWinners;
  }

  set stepWinners(winners) {
    this.results.stepWinners.length = 0;
    this.results.stepWinners.push(...winners);
  }

  get currentStep() {
    return (
      this.results.rounds[this.results.currentRoundIndex].playedSongs.length + 1
    );
  }

  getLastStart() {
    const now = new Date();
    return `${this.addZero(now.getDate())}/${this.addZero(
      now.getMonth() + 1
    )}/${now.getFullYear()} ${this.addZero(now.getHours())}:${this.addZero(
      now.getMinutes()
    )}`;
  }

  private addZero(number: number): string {
    return (number < 10 ? '0' : '') + number.toString();
  }

  isRoundFinished(game: IGame, roundIndex: number) {
    return (
      game.results.rounds[roundIndex].playedSongs.length ===
      game.rounds[roundIndex].field.flat().length
    );
  }

  isGameFinished(game: IGame) {
    return !game.rounds.some((_, index) => !this.isRoundFinished(game, index));
  }

  ngOnDestroy(): void {
    this.playerService.gameMode = false;
    this.socketService.unsubscribe(SocketMessageType.Game);
  }
}

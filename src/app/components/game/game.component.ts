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
  ISongWithSettings,
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
import { DEFAULT_BACKGROUND_MUSIC } from '../../constants/constants';

const DEEP = 0;

const WIN_NAMING = {
  [Winner.Line]: 'Линию',
  [Winner.Cross]: 'Крест',
  [Winner.All]: 'Все песни',
};

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements OnDestroy {
  public isGameStarted = false;
  public showName = false;
  wantedWinner: Winner | null = Winner.Line;
  time = 0;
  currentStep = 0;
  songsArray: string[] = [];
  deep = DEEP;
  boost = 1000;
  errors = 0;
  gameWinners: number[] = [];
  wastedTickets: number[] = [];
  game: IGame;
  currentRound!: IRound;
  currentRoundTickets: IPlayingTicket[] = [];
  selectedSong: IRoundSong | null = null;
  playedSongs: string[] = [];
  roundIndex = 0;
  currentWinners: Set<number> = new Set();
  simulation = false;

  constructor(
    private playerService: PlayerService,
    public stateService: StateService,
    private creatorService: CreatorService,
    private modalService: ModalService,
    private socketService: SocketService,
    private dialogService: DialogService
  ) {
    // this.simulateGames(50);
    this.playerService.gameMode = true;
    this.playerService.playBackGround();
    // this.socketService.onMessage<boolean | null>(SocketMessageType.Player, ({data}) => {
    //   if(data === true){
    //     this.nextSong();
    //   } else if(data === false){
    //     this.playerService.stop();
    //   }
    // });
    // this.socketService.onMessage<TicketsMessagePayload>(SocketMessageType.Tickets, ({data}) => {
    //   if(data.add){
    //     this.wastedTickets = Array.from(new Set([...this.wastedTickets, ...data.tickets]))
    //   } else {
    //     this.wastedTickets = this.wastedTickets.filter(ticket => !data.tickets.includes(ticket))
    //   }
    // });
    this.game = this.creatorService.generateGame(storedSongs, {
      tickets: 42,
      backgroundMusic: DEFAULT_BACKGROUND_MUSIC,
      rounds: [
        {
          roundFieldColumns: 7,
          roundFieldRows: 6,
          ticketFieldColumns: 5,
          ticketFieldRows: 5,
          lineWinners: 1,
          crossWinners: 1,
          allWinners: 1,
          notRusSongs: 5,
        },
        {
          roundFieldColumns: 7,
          roundFieldRows: 6,
          ticketFieldColumns: 5,
          ticketFieldRows: 5,
          lineWinners: 1,
          crossWinners: 1,
          allWinners: 1,
          notRusSongs: 5,
        },
      ],
    });
  }

  startGame() {
    if (this.roundIndex) {
      this.prepareRound();
      return;
    }
    // this.game = this.creatorService.generateGame();
    this.playNewGame();
    // this.simulateGames(10)
  }

  simulateGames(count: number) {
    for (let index = 0; index < count; index++) {
      this.simulateNewGame();
      console.log(`${this.errors}/${(index + 1) * 2}`);
    }
  }

  simulateNewGame() {
    // this.game = this.creatorService.generateGame();
    this.gameWinners = [];
    this.wastedTickets = this.game.tickets
      .map((ticket) => ticket.number)
      .filter((number) => number > 10);

    for (let i = 0; i < this.game.rounds.length; i++) {
      this.roundIndex = i;
      this.simulateRound();
    }
  }

  simulateRound() {
    this.prepareRound();
    console.log(
      'players ',
      this.currentRoundTickets.length - this.wastedTickets.length
    );
    this.simulateStep();
  }

  simulateStep() {
    this.currentStep++;
    this.deep = DEEP + Math.floor(this.currentStep / 10);
    const selectedSongId = this.selectSong();
    this.currentWinners = this.getWinners(selectedSongId);
    this.playedSongs.push(selectedSongId);

    if (
      this.wantedWinner &&
      this.currentWinners.size >
        (this.currentRound[this.wantedWinner].count || 99)
    ) {
      this.errors++;
    }
    if (this.currentWinners.size) {
      this.submitWin();
    }
    if (this.playedSongs.length < this.roundSongs.length) {
      this.simulateStep();
    }
  }

  playNewGame() {
    this.gameWinners = [];
    this.wastedTickets = [];
    this.roundIndex = 0;
    this.prepareRound();
  }

  prepareRound() {
    this.showName = false;
    this.playedSongs = [];
    this.currentStep = 0;
    this.wantedWinner = Winner.Line;
    this.currentRound = this.game.rounds[this.roundIndex];
    this.currentRoundTickets = this.game.tickets.map((ticket) => {
      return {
        number: ticket.number,
        field: ticket.rounds[this.roundIndex].field,
      };
    });
    this.isGameStarted = true;
  }

  handleClick(event: Event) {
    event?.stopImmediatePropagation();
    this.nextSong();
  }

  nextSong() {
    if (!this.playerService.$init.value) {
      return;
    }
    if (this.playedSongs.length === this.roundSongs.length) {
      this.isGameStarted = false;
      this.roundIndex++;
      return;
    }
    this.handleStart();
  }

  handleStop() {
    this.showName = true;
    this.selectedSong!.played = true;
    if (this.currentWinners.size) {
      this.askWinner(this.currentWinners);
    }
  }

  handleStart() {
    this.showName = false;
    this.currentStep++;
    this.deep = DEEP + Math.floor(this.currentStep / 10);
    this.selectedSong = null;
    const availableSongs = this.roundSongs
      .filter((song) => !this.playedSongs.includes(song.youtubeId))
      .sort(() => Math.random() - 0.5);
    let randomizerIndex = 0;
    const randomizerInterval = setInterval(
      () => {
        this.roundSongs.forEach((song) => (song.class = ''));
        availableSongs[randomizerIndex++ % availableSongs.length].class =
          'blue';
      },
      this.simulation ? 0 : 250
    );

    const selectedSongId = this.selectSong();
    this.selectedSong = this.roundSongs.find(
      (song) => song.youtubeId === selectedSongId
    )!;
    const playPromise = this.simulation
      ? Promise.resolve()
      : this.playerService.play(this.selectedSong);
    playPromise.then(this.handleStop.bind(this));

    setTimeout(
      () => {
        clearInterval(randomizerInterval);
        this.roundSongs.forEach((song) => (song.class = ''));
        this.selectedSong!.class = 'green';
      },
      this.simulation ? 0 : environment.playerDelay * 1000 - 500
    );
    this.currentWinners = this.getWinners(selectedSongId);
    this.playedSongs.push(selectedSongId);
  }

  get playingTickets() {
    return this.currentRoundTickets.filter(
      (ticket) => !this.wastedTickets.includes(ticket.number)
    );
  }

  get roundSongs() {
    return this.currentRound.field.flat();
  }

  selectSong(): string {
    const weights = this.getWeights();
    const selectedWeight = weights.sort((a, b) => b.weight - a.weight)[0];
    return selectedWeight.songId;
  }

  getWinners(selectedSongId: string, playedSongs?: string[]): Set<number> {
    return this.playingTickets.reduce((result, ticket) => {
      const isWinner = this.trySongInTicket(
        selectedSongId,
        ticket,
        playedSongs ?? this.playedSongs
      );
      if (isWinner) {
        result.add(ticket.number);
      }
      return result;
    }, new Set<number>());
  }

  getWeights(): Weight[] {
    const weights = [];
    const songs = this.currentRound.field
      .flat()
      .map((song) => song.youtubeId)
      .filter((songId) => !this.playedSongs.includes(songId))
      .sort(() => Math.random() - 0.5);
    for (const songId of songs) {
      const weight = this.getWeightsForSong(songId, songs, this.playedSongs);
      weights.push({ songId, weight });
    }
    return weights;
  }

  getWeightsForSong(
    songId: string,
    songs: string[],
    playedSongs: string[]
  ): number {
    if (this.currentStep <= 7 || this.wantedWinner == null || this.deep === 0) {
      return 1;
    }
    const restOfSongs = songs.filter((song) => song !== songId);
    if (!songs.length) {
      return -this.boost;
    }
    const currentWinners = this.getWinners(songId, playedSongs);
    const step = this.currentStep + (DEEP - this.deep);
    const weight = this.getResultWeight(currentWinners, step);
    if (weight != null) {
      return weight;
    }

    let success = 0;
    const level = this.deep;
    --this.deep;
    for (const subSongId of restOfSongs) {
      const weight = this.getWeightsForSong(subSongId, restOfSongs, [
        ...playedSongs,
        songId,
      ]);
      success += weight;
    }
    this.deep = level;
    return success / songs.length;
  }

  askWinner(currentWinners: Set<number>) {
    const winnerQuestion = `Билет${
      currentWinners.size > 1 ? 'ы' : ''
    } #${Array.from(currentWinners).join(', ')} собрал${
      currentWinners.size > 1 ? 'и' : ''
    } ${WIN_NAMING[this.wantedWinner!]}. Билет в игре?`;
    this.modalService.openModal(winnerQuestion).then((answer) => {
      if (answer) {
        this.submitWin();
      }
    });
  }

  submitWin() {
    console.log(
      `Билеты № ${Array.from(this.currentWinners)} выиграли ${
        WIN_NAMING[this.wantedWinner!]
      } в ${this.currentRound.name} на ${this.currentStep} ходу`
    );
    this.wantedWinner =
      this.wantedWinner === Winner.Line
        ? Winner.Cross
        : this.wantedWinner === Winner.Cross
        ? Winner.All
        : null;
    this.gameWinners.push(...Array.from(this.currentWinners));
  }

  getResultWeight(currentWinners: Set<number>, step: number): number | null {
    const winnersArray = Array.from(currentWinners);
    const { count, tickets } = this.currentRound[this.wantedWinner!];
    if (
      winnersArray.length > count ||
      winnersArray.some((winner) => this.gameWinners.includes(winner))
    ) {
      return -this.boost * 10;
    }
    // if (currentWinners.length > count) {
    //   return -this.boost * 1000;
    // }
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

  trySongInTicket(
    songId: string,
    ticket: IPlayingTicket,
    playedSongs: string[]
  ): boolean {
    let result = false;
    const linesSimulation = ticket.field.map(
      (row) =>
        new Set(
          row
            .filter((song) => !playedSongs.includes(song.youtubeId))
            .map((song) => song.youtubeId)
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
            .filter((row) => !playedSongs.includes(row[columnIndex].youtubeId))
            .map((row) => row[columnIndex].youtubeId)
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
    if (this.wantedWinner === Winner.Line && (verticalWin || horizontalWin)) {
      result = true;
    }
    if (this.wantedWinner === Winner.Cross && verticalWin && horizontalWin) {
      result = true;
    }
    if (this.wantedWinner === Winner.All) {
      const rest = new Set(
        [...verticalLines, ...horizontalLines].map((s) => [...s]).flat()
      );
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
  }
}

const storedSongs: ISongWithSettings[] = [
  {
    artist: 'AC/DC',
    name: 'Highway to Hell',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'LMuDrj5BpM0',
    start: 48,
  },
  {
    artist: 'AP$ENT',
    name: 'Можно я с тобой?',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '4aVBzpr7RIo',
    start: 23,
  },
  {
    artist: 'Animal ДжаZ',
    name: 'Три полоски',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'czlg64LxNe8',
    start: 122,
  },
  {
    artist: 'Avril Lavigne',
    name: 'Complicated ',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '5eGbnVlRcRg',
    start: 60,
  },
  {
    artist: 'Blur',
    name: 'Song 2',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'SSbBvKaM6sk',
    start: 13,
  },
  {
    artist: 'Bob Dylan',
    name: "Knockin' on Heaven's Door",
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '_UZONrzoFrY',
    start: 48,
  },
  {
    artist: 'Bon Jovi',
    name: "It's My Life",
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'VyZeqzWvR7w',
    start: 38,
  },
  {
    artist: 'BrainStorm',
    name: 'Выходные',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'RUb-7mM3gks',
    start: 50,
  },
  {
    artist: 'Cream Soda & Хлеб',
    name: 'Плачу на техно',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '4ZurH8I_c9o',
    start: 33,
  },
  {
    artist: 'Eurythmics',
    name: 'Sweet Dreams',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'bG9z-atG7gc',
    start: 4,
  },
  {
    artist: 'Gorillaz',
    name: 'Clint Eastwood',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'dWciK2-idhk',
    start: 97,
  },
  {
    artist: 'Haddaway',
    name: 'What Is Love',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'G8RY_XOqJf4',
    start: 59,
  },
  {
    artist: 'Hi-Fi',
    name: '7 Лепесток',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'EBEhwgFeeBc',
    start: 26,
  },
  {
    artist: 'Hi-Fi',
    name: 'А мы любили',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'c141WyYC6AM',
    start: 39,
  },
  {
    artist: 'Imagine Dragons',
    name: 'Enemy',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'hHB1Ikzfpmc',
    start: 30,
  },
  {
    artist: 'Imagine Dragons',
    name: 'Believer',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'W0DM5lcj6mw',
    start: 52,
  },
  {
    artist: 'Jaxomy & Co',
    name: 'Pedro',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'YCCDQfYMo0s',
    start: 22,
  },
  {
    artist: 'Kaiser Chiefs',
    name: 'Ruby',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'Tx_CNm7oLCg',
    start: 45,
  },
  {
    artist: 'Katy Perry',
    name: 'I Kissed A Girl',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'C3KPlowsyJs',
    start: 30,
  },
  {
    artist: 'Katy Perry',
    name: 'Hot N Cold',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'R6ubXNlHFow',
    start: 30,
  },
  {
    artist: 'Kesha ',
    name: 'TiK ToK',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'OF04pKp-r9o',
    start: 94,
  },
  {
    artist: 'LOBODA',
    name: 'ТВои глаза',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'mTVqRXY01aI',
    start: 43,
  },
  {
    artist: 'Lenny Kravitz',
    name: 'Fly Away',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '4jSGMJZv764',
    start: 46,
  },
  {
    artist: 'Linkin Park',
    name: 'In The End',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'd_toKURCt10',
    start: 53,
  },
  {
    artist: 'Luis Fonsi',
    name: 'Despacito',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'kJQP7kiw5Fk',
    start: 80,
  },
  {
    artist: 'Miley Cyrus',
    name: 'Flowers',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'iawgB2CDCrw',
    start: 30,
  },
  {
    artist: 'Noize MC',
    name: 'Выдыхай',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '2daL-oy01nU',
    start: 56,
  },
  {
    artist: 'Queen',
    name: 'We Will Rock You',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'TXGbhniTBrU',
    start: 22,
  },
  {
    artist: 'Quest Pistols',
    name: 'Ты Так Красива',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'DYx-gywi7Dk',
    start: 34,
  },
  {
    artist: 'Quest Pistols',
    name: 'Я Устал',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '7gYPfRVVR0U',
    start: 26,
  },
  {
    artist: 'Radiohead',
    name: 'Creep',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'l5t9IXtTr6g',
    start: 56,
  },
  {
    artist: 'Red Hot Chili Peppers',
    name: "Can't Stop",
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '8a-9Sd35HNI',
    start: 29,
  },
  {
    artist: 'Roxette',
    name: 'Listen To Your Heart',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'E310_bV4vEA',
    start: 40,
  },
  {
    artist: 'SEREBRO',
    name: 'МАМА ЛЮБА',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'yblMlH_JYUM',
    start: 45,
  },
  {
    artist: 'Shakira',
    name: 'Whenever',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '5v-WAEvA7C4',
    start: 40,
  },
  {
    artist: 'System Of A Down',
    name: 'Chop Suey',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'DOckYuS32iY',
    start: 41,
  },
  {
    artist: 'The Beatles',
    name: 'Yellow Submarine',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'rINa_BbHzZs',
    start: 31,
  },
  {
    artist: 'The Black Eyed Peas',
    name: "Let's Get It Started",
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'An7jqlIu-0I',
    start: 47,
  },
  {
    artist: 'The Cranberries',
    name: 'Zombie',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '8sM-rm4lFZg',
    start: 79,
  },
  {
    artist: 'The Killers',
    name: 'Somebody Told Me',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '3K7BsS6_AVw',
    start: 61,
  },
  {
    artist: 'The Offspring',
    name: 'Pretty Fly',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'HoOhk9iGxE4',
    start: 72,
  },
  {
    artist: 'Zdob si Zdub',
    name: 'Видели ночь',
    rus: false,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'fu4ZMfWPOH4',
    start: 33,
  },
  {
    artist: 'Агата Кристи',
    name: 'Как на войне',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'JGIeQSNGUpY',
    start: 64,
  },
  {
    artist: 'Алексей Чумаков',
    name: 'Необыкновенная',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '9OYy2IeZinI',
    start: 47,
  },
  {
    artist: 'Андрей Губин',
    name: 'Ночь',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'GL0L2RbOZzg',
    start: 50,
  },
  {
    artist: 'Андрей Губин',
    name: 'Девушки как звёзды',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'nMRjY2khgkE',
    start: 62,
  },
  {
    artist: "Банд'Эрос",
    name: 'Коламбия Пикчерз не представляет',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'z2AmjZbEWgE',
    start: 69,
  },
  {
    artist: 'Баста',
    name: 'Сансара',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '41iMX5ngwV0',
    start: 72,
  },
  {
    artist: 'Блестящие',
    name: 'За четыре моря',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '54UspYYEaVs',
    start: 40,
  },
  {
    artist: 'Блестящие',
    name: 'Восточные сказки',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'Fm-MiLnHwx4',
    start: 38,
  },
  {
    artist: 'Браво',
    name: 'Любите, девушки',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'qvyLSXGwoMw',
    start: 38,
  },
  {
    artist: 'Браво',
    name: 'Дорога в облака',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'oXrgoLkG8pg',
    start: 53,
  },
  {
    artist: 'Бумбокс',
    name: 'Вахтерам',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'vaj2PTDzeio',
    start: 139,
  },
  {
    artist: 'ВИА Гра',
    name: 'Попытка №5',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'D3AbZVQTG-w',
    start: 43,
  },
  {
    artist: 'Валентин Стрыкало',
    name: 'Наше лето',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'HO5FbO0YcMg',
    start: 131,
  },
  {
    artist: 'Валерий Меладзе',
    name: 'Самбо белого мотылька',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '7HhFaPgFwj0',
    start: 56,
  },
  {
    artist: 'Валерий Меладзе',
    name: 'Салют, Вера',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'pkeawfNnzjw',
    start: 50,
  },
  {
    artist: 'Валерий Меладзе',
    name: 'Текила любовь',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'OzUzwhBWRr4',
    start: 42,
  },
  {
    artist: 'Валерий Меладзе',
    name: 'Притяжения больше нет',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'b7G5twVZVHM',
    start: 78,
  },
  {
    artist: 'Верка сердючка',
    name: 'Всё будет хорошо',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'k5ZRVPp8R0Q',
    start: 31,
  },
  {
    artist: 'Винтаж',
    name: 'Плохая девочка',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '49UpAFMhmP0',
    start: 54,
  },
  {
    artist: 'Глюк’oZa',
    name: 'Невеста',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'SzlGR9ValNc',
    start: 72,
  },
  {
    artist: 'Город 312',
    name: 'Вне зоны доступа',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '32kBLclkumI',
    start: 45,
  },
  {
    artist: 'Город 312',
    name: 'Останусь',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'PVcILgD1qBo',
    start: 50,
  },
  {
    artist: 'Градусы',
    name: 'Голая',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'd8G7_Cxl-_I',
    start: 57,
  },
  {
    artist: 'Грибы',
    name: 'Тает Лёд',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'Ig2veaeITEA',
    start: 128,
  },
  {
    artist: 'ДДТ',
    name: 'Это все',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '6PK_FuShTOs',
    start: 231,
  },
  {
    artist: 'ДЕМО',
    name: 'Солнышко',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'hKXDDpoqvnI',
    start: 65,
  },
  {
    artist: 'Децл',
    name: 'Вечеринка',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'NU-XAxBkEaE',
    start: 76,
  },
  {
    artist: 'Дима Билан',
    name: 'Невозможное возможно',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'C_hsGFpA1ik',
    start: 49,
  },
  {
    artist: 'Дискотека Авария',
    name: 'Если хочешь остаться',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'qN9ylHPY6fQ',
    start: 26,
  },
  {
    artist: 'Дискотека Авария',
    name: 'Пей пиво',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'UBLcsAnGzJQ',
    start: 67,
  },
  {
    artist: 'Ёлка',
    name: 'Прованс',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'oXb6jg3OTG0',
    start: 54,
  },
  {
    artist: 'Жанна Фриске',
    name: 'Ла-ла-ла',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'ebPdskNpzQI',
    start: 45,
  },
  {
    artist: 'Женя Отрадная',
    name: 'Уходи и дверь закрой',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'H1F0EDwID28',
    start: 37,
  },
  {
    artist: 'Жуки',
    name: 'Батарейка',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'hhpIU5U2N24',
    start: 71,
  },
  {
    artist: 'Звери',
    name: 'Районы-кварталы',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'CqZJ1aT1eYY',
    start: 39,
  },
  {
    artist: 'Звери',
    name: 'До скорой встречи',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'NqAp7l82UaI',
    start: 84,
  },
  {
    artist: 'Звери',
    name: 'Дожди-пистолеты',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'CTQxNgCejVg',
    start: 62,
  },
  {
    artist: 'Земфира',
    name: 'Бесконечность ',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'Fxj4gAZkB0k',
    start: 104,
  },
  {
    artist: 'Земфира',
    name: 'Ромашки',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'qKuTh2xmGWg',
    start: 47,
  },
  {
    artist: 'Земфира',
    name: 'Искала',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'imCUXkbjhzU',
    start: 36,
  },
  {
    artist: 'Иван Дорн',
    name: 'Стыцамэн',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'YwGOfyg77Uk',
    start: 123,
  },
  {
    artist: 'Иванушки Int.',
    name: 'Тополиный пух',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'wpk3Iwo0Kr0',
    start: 114,
  },
  {
    artist: 'Иракли',
    name: 'Лондон Париж',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'jCmOPKJX8wA',
    start: 57,
  },
  {
    artist: 'Ирина Аллегрова',
    name: 'Младший лейтенант',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'jjhn8-U9Kl8',
    start: 127,
  },
  {
    artist: 'Ирина Аллегрова',
    name: 'Угонщица',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'qN1JUvS2kqo',
    start: 56,
  },
  {
    artist: 'Каста',
    name: 'Вокруг шум',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'avq3kIvqn-o',
    start: 51,
  },
  {
    artist: 'Каста',
    name: 'Сочиняй мечты',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'GpV0hvsKmUQ',
    start: 140,
  },
  {
    artist: 'Катя Лель',
    name: 'Мой Мармеладный',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '18jjqM4-OFg',
    start: 59,
  },
  {
    artist: 'Кипелов',
    name: 'Я свободен',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '44rsGyOANgw',
    start: 132,
  },
  {
    artist: 'Корни',
    name: 'С днем рождения Вика',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '-0TCsm-O45Y',
    start: 42,
  },
  {
    artist: 'Король и Шут',
    name: 'Кукла колдуна',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'sbSWDBk5Z7g',
    start: 48,
  },
  {
    artist: 'Король и Шут',
    name: 'Прыгну со скалы',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'fd0miVbzU30',
    start: 19,
  },
  {
    artist: 'ЛЕПРИКОНСЫ',
    name: 'Хали-гали, паратрупер',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'guRv3iguxkk',
    start: 135,
  },
  {
    artist: 'Леонид Агутин',
    name: 'Остров',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'ePa2g0Igsr8',
    start: 74,
  },
  {
    artist: 'Леонид Агутин',
    name: 'Хоп Хей Лала-Лей',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'g-uZMyGg71A',
    start: 120,
  },
  {
    artist: 'Лолита',
    name: 'На Титанике',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'y8lRv_aLL3I',
    start: 83,
  },
  {
    artist: 'МакSим',
    name: 'Вертром стать',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'kBs40FFOZrE',
    start: 116,
  },
  {
    artist: 'МакSим',
    name: 'Знаешь ли ты',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '_v8fXKA5DI8',
    start: 142,
  },
  {
    artist: 'Макс Корж',
    name: 'Жить в кайф',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'OQhuqA6UhmE',
    start: 44,
  },
  {
    artist: 'Мария Ржевская',
    name: 'Когда я стану кошкой',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'UZ9ac7vb8-E',
    start: 50,
  },
  {
    artist: 'Михей и Джуманджи',
    name: 'Сука-любовь',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'M4UtiYaOjmg',
    start: 99,
  },
  {
    artist: 'Многоточие',
    name: 'В жизни так бывает',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'KVvZjwX35wI',
    start: 993,
  },
  {
    artist: 'Монеточка',
    name: 'Каждый раз',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'pNSoGfaWx6o',
    start: 66,
  },
  {
    artist: 'Мумий Тролль',
    name: 'Невеста',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'YjCOZvoFiTc',
    start: 112,
  },
  {
    artist: 'Мумий Тролль',
    name: 'Владивосток 2000',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'rD2J_ocb3cU',
    start: 33,
  },
  {
    artist: 'Мумий Тролль',
    name: 'Утекай',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'Ok1-XYV3k60',
    start: 26,
  },
  {
    artist: 'Натали',
    name: 'О боже, какой мужчина!',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'vfVIxW7DUYI',
    start: 40,
  },
  {
    artist: 'Ноль',
    name: 'Человек и кошка',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'wQffLMBdIwU',
    start: 40,
  },
  {
    artist: 'Нюша',
    name: 'Выбирать чудо',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'M5_61X320os',
    start: 38,
  },
  {
    artist: 'Отпетые Мошенники',
    name: 'Девушки бывают разные',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'W8IRmYdgUXg',
    start: 58,
  },
  {
    artist: 'Отпетые Мошенники',
    name: 'Люби меня, люби',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '0NK2sKZljcY',
    start: 94,
  },
  {
    artist: 'ПОРНОФИЛЬМЫ',
    name: 'Я так соскучился',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '8U_MiEAjhDc',
    start: 74,
  },
  {
    artist: 'Рок-Острова',
    name: 'Ничего не говори',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'dijcAFMkgk0',
    start: 80,
  },
  {
    artist: 'Руки Вверх!',
    name: 'Крошка моя',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'xno9GOi3FaI',
    start: 123,
  },
  {
    artist: 'Руки Вверх!',
    name: 'Чужие Губы',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '60w93RcyKeg',
    start: 55,
  },
  {
    artist: 'Руки Вверх!',
    name: 'Алёшка',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'oz0NAYehGc0',
    start: 52,
  },
  {
    artist: 'Руки Вверх!',
    name: '18 мне уже',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 't_la20ZBpCQ',
    start: 62,
  },
  {
    artist: 'Сплин',
    name: 'Выхода нет',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'XakXGfd07hk',
    start: 40,
  },
  {
    artist: 'Сплин',
    name: 'Орбит без сахара',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'N1wBJkkjzW0',
    start: 25,
  },
  {
    artist: 'Султан Лагучев',
    name: 'Горький вкус',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'v5DBulc5nA0',
    start: 29,
  },
  {
    artist: 'ТаТу',
    name: 'Нас не догонят',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'vd_-qkJdGfw',
    start: 76,
  },
  {
    artist: 'ТаТу',
    name: 'Я сошла с ума',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'NbRAH7xTXHg',
    start: 55,
  },
  {
    artist: 'Танцы Минус',
    name: 'Город',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'nKpFuiANJyQ',
    start: 47,
  },
  {
    artist: 'Трофимов',
    name: 'Поезда',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'qEelwwLmX38',
    start: 57,
  },
  {
    artist: 'Ундервуд',
    name: 'Гагарин, я вас любила',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'ZQxqQ6-3yAE',
    start: 41,
  },
  {
    artist: 'ФАБРИКА',
    name: 'Про любовь',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'TS7gm1GPwNI',
    start: 26,
  },
  {
    artist: 'Фактор 2',
    name: 'Красавица',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: '0uGEVMd2pyE',
    start: 41,
  },
  {
    artist: 'Элджей & Feduk',
    name: 'Розовое вино',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'LKTalcjnE2U',
    start: 19,
  },
  {
    artist: 'Юлия Савичева',
    name: 'Если в сердце живёт любовь',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'JjyiuU5T2ag',
    start: 90,
  },
  {
    artist: 'Юлия Савичева',
    name: 'Привет',
    rus: true,
    priority: false,
    disabled: false,
    round: undefined,
    games: [],
    id: 'test',
    youtubeId: 'e5VyPAx7-cw',
    start: 115,
  },
];

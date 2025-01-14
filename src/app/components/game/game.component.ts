import { Component } from '@angular/core';
import { IGame, IGameRound, IGameVideo, IVideo, IWinner, Win } from '../../models/models';
import { PlayerService } from '../../services/player.service';
import { environment } from '../../../environments/environment';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent {
  public game = this.stateService.game;
  public currentRound = 0;
  public isGameStarted = false;
  public selectedVideo: IGameVideo | null = null;
  public isPlaying = false;
  public block = false;
  public showName = false;
  winFirstLine = false;
  winCross = false;
  winAll = false;
  step = 0;
  winners = {
    [Win.FirstLine]: {
      step: 0,
      winners: [] as number[]
    },
    [Win.Cross]: {
      step: 0,
      winners: [] as number[]
    },
    [Win.All]: {
      step: 0,
      winners: [] as number[]
    },
  }
  simulation = true;
  simulationAttempt = 0;
  roundIndex = 0;



  constructor(private playerService: PlayerService, public stateService: StateService) { }

  startGame() {
    this.isGameStarted = true;
    this.stateService.initGame();
    this.game = this.stateService.game;
    this.game.rounds[this.currentRound].active = true;
    this.stateService.$nextRound.subscribe(() => {
      if (this.isGameStarted && this.game.rounds[this.currentRound + 1]){
        this.nextRound();
      }
    })
  }

  dropWinners() {
    this.winFirstLine = false;
    this.winCross = false;
    this.winAll = false;
    this.step = 0;
    this.winners = {
      [Win.FirstLine]: {
        step: 0,
        winners: []
      },
      [Win.Cross]: {
        step: 0,
        winners: []
      },
      [Win.All]: {
        step: 0,
        winners: []
      },
    }
  }

  play(round: number, event: Event) {
    event?.stopImmediatePropagation();
    this.showName = false;
    if (!this.playerService.$init.value) {
      return;
    }
    if (this.isPlaying) {

      if (!this.simulation) {
        if (this.block) {
          return;
        }
        this.isPlaying = false;
        this.playerService.$stop.next(undefined);
        this.showName = true;
      } else {
        this.isPlaying = false;
        this.play(round, new Event(''))
      }

      return;
    }
    if (this.selectedVideo) {
      this.selectedVideo.class = '';
    }
    this.step++;
    this.isPlaying = true;

    this.game.rounds[round].videos.forEach(video => {
      video.class = '';
      if (video.id === this.selectedVideo?.id) {
        video.played = true;
      }
    })
    this.selectedVideo = null;
    const videos = [...this.game.rounds[round].videos].filter(video => !video.played);
    if (videos.length === 0) {
      if (this.simulation) {
        const { lineWinners, crossWinners, allWinners } = this.game.rounds[round];
        const winners = [...this.winners[Win.FirstLine].winners, ...this.winners[Win.Cross].winners, ...this.winners[Win.All].winners];
        if (
          lineWinners !== this.winners[Win.FirstLine].winners.length ||
          crossWinners !== this.winners[Win.Cross].winners.length ||
          allWinners !== this.winners[Win.All].winners.length ||
          (!this.game.rounds[round].doubleWin && winners.length > new Set(winners).size) ||
          (!this.game.doubleWin && winners.some(winner => this.game.winners.has(winner)))
        ) {
          this.dropWinners();
          console.log('attempt',++this.simulationAttempt);
          this.game.rounds[round].players.forEach(player => {
            player.linesSimulation = [...player.lines].map(line => {
              return new Set([...line])
            })
          });

          this.game.rounds[round].steps = [];
          this.game.rounds[round].videos.forEach(video => video.played = false)
          setTimeout(() => this.play(round, new Event('')), 10);
          return;
        }
        this.game.rounds[round].players.forEach(player => {
            player.linesSimulation = [...player.lines].map(line => {
              return new Set([...line])
            })
          });
        console.log('FirstLine', this.winners[Win.FirstLine].step, this.winners[Win.FirstLine].winners)
        console.log('Cross', this.winners[Win.Cross].step, this.winners[Win.Cross].winners)
        console.log('All', this.winners[Win.All].step, this.winners[Win.All].winners);
        console.log(this.winners);
        [...this.game.rounds[round].videos].forEach(video => video.played = false);
        winners.forEach(winner => this.game.winners.add(winner));
        this.game.rounds[round].savedSteps = [...this.game.rounds[round].steps];
        this.dropWinners();
        this.isPlaying = false;
        if ((this.currentRound + 1) < this.game.rounds.length) {
          this.game.rounds[round].active = false
          this.currentRound++;
          this.game.rounds[this.currentRound].active = false
          this.play(this.currentRound, new Event(''));
        } else {
          this.stateService.saveGame();
          this.currentRound = 0;
          this.stateService.showCards = true;
        }
      }
      console.log('end');
      return;
    }
    let selectedVideo = this.selectVideo(this.game.rounds[round]);
    this.game.rounds[round].steps.push(selectedVideo.id);

    const winners: IWinner[] = [];
    const players = this.game.rounds[round].players;
    players.forEach(player => {
      let completedRows = 0;
      let completedColumns = 0;
      let hasCells = false;
      player.linesSimulation.forEach((line, index) => {
        const hasSong = line.has(selectedVideo.id)
        line.delete(selectedVideo.id);
        if (hasSong && !line.size) {
          const isRow = index <= this.game.rounds[round].playerFieldRows;
          isRow ? completedRows++ : completedColumns++;
        }
        if (line.size) {
          hasCells = true;
        }
      });
      if (!this.winFirstLine && (completedRows || completedColumns)) {
        winners.push({ type: Win.FirstLine, player, step: this.step });

      }
      if (!this.winCross && (completedRows && completedColumns)) {
        winners.push({ type: Win.Cross, player, step: this.step })
      }
      if (!this.winAll && !hasCells) {
        winners.push({ type: Win.All, player, step: this.step })
      }
    })
    winners.forEach(winner => {
      if (!this.winFirstLine && winner.type === Win.FirstLine) {
        this.winFirstLine = true;
      }
      if (!this.winCross && winner.type === Win.Cross) {
        this.winCross = true;
      }
      if (!this.winAll && winner.type === Win.All) {
        this.winAll = true;
      }
    });
    const firstLineWinners = winners.filter(winner => winner.type == Win.FirstLine);
    if (firstLineWinners.length) {
      this.winners[Win.FirstLine].winners = firstLineWinners.map(winner => winner.player.number);
      this.winners[Win.FirstLine].step = this.step;
    }
    const crossWinners = winners.filter(winner => winner.type == Win.Cross);
    if (crossWinners.length) {
      this.winners[Win.Cross].winners = crossWinners.map(winner => winner.player.number);
      this.winners[Win.Cross].step = this.step;
    }
    const allWinners = winners.filter(winner => winner.type == Win.All);
    if (allWinners.length) {
      this.winners[Win.All].winners = allWinners.map(winner => winner.player.number);
      this.winners[Win.All].step = this.step;
    }
    this.selectedVideo = selectedVideo;
    videos.forEach(video => video.class = '');
    if (this.simulation) {
      selectedVideo.played = true;
      setTimeout(() => this.play(round, event));
    } else {
      const interval = setInterval(() => {
        videos.forEach(video => video.class = '');
        videos[Math.floor(Math.random() * videos.length)].class = 'blue';
      }, 250);
      this.block = true;
      this.playerService.$video.next(selectedVideo);
      setTimeout(() => {
        clearInterval(interval);
        videos.forEach(video => video.class = '');
        selectedVideo.class = 'green';
        this.selectedVideo = selectedVideo;
      }, (environment.playerDelay * 1000) - 500);
      setTimeout(() => {
        this.selectedVideo!.played = true;
        this.block = false;
      }, (environment.playerDelay * 1000) + 2000);

    }



  }

  private selectVideo(round: IGameRound) {
    if (round.savedSteps.length){
      if(![...round.videos].find(video => video.id === round.savedSteps[this.step -1])){
        console.log('');
      }
      return [...round.videos].find(video => video.id === round.savedSteps[this.step -1])!;
    }
    const videos = [...round.videos].filter(video => !video.played);
    // const priorityVideos = videos.filter(video => video.priority);
    // if(priorityVideos.length){
    //   return priorityVideos[Math.floor(Math.random() * priorityVideos.length)];
    // }
    return videos[Math.floor(Math.random() * videos.length)];
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
    }

    // this.playerService.$video.next(video);
  }

  getPlayer(round: number, number: number){
    return this.game.rounds[round].players.find(player => player.number === number)
  }

  nextRound() {
    this.selectedVideo = null;
    this.isPlaying = false;
    this.dropWinners();
    this.game.rounds[this.currentRound++].active = false;
    this.game.rounds[this.currentRound].active = true;
  }

}



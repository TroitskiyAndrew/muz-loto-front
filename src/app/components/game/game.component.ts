import { Component } from '@angular/core';
import { IGame, IGameVideo, IVideo } from '../../models/models';
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
  private isPlaying = false;

  constructor(private playerService: PlayerService, public stateService: StateService) { }

  startGame() {
    this.isGameStarted = true;
    this.stateService.initGame();
    this.game = this.stateService.game;
    this.game.rounds[this.currentRound].active = true;
  }

  play(round: number) {
    if (this.isPlaying || !this.playerService.$init.value) {
      return;
    }

    this.game.rounds[round].videos.forEach(video => {
      video.selected = false;
      if (video.id === this.selectedVideo?.id) {
        video.played = true;
      }
    })
    this.selectedVideo = null;
    this.isPlaying = true;
    const videos = [...this.game.rounds[round].videos].filter(video => !video.played);
    if (videos.length === 0) {
      console.log('end');
      return;
    }
    const selectedVideo = videos[Math.floor(Math.random() * videos.length)];
    const interval = setInterval(() => {
      videos.forEach(video => video.selected = false);
      videos[Math.floor(Math.random() * videos.length)].selected = true;
    }, 250);
    this.playerService.$video.next(selectedVideo);
    setTimeout(() => {
      clearInterval(interval);
      videos.forEach(video => video.selected = false);
      selectedVideo.selected = true;
    }, (environment.playerDelay * 1000) - 500);

    setTimeout(() => {
      this.selectedVideo = selectedVideo;
      this.isPlaying = false;
    }, (environment.playerDelay + selectedVideo.duration) * 1000);

  }

  nextRound(){
    this.selectedVideo = null;
    this.game.rounds[this.currentRound++].active = false;
    this.game.rounds[this.currentRound].active = true;
  }

}



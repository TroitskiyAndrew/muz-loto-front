import { AfterViewInit, Component, ElementRef, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { PlayerService } from '../../services/player.service';
import { ISong } from '../../models/models';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss'
})
export class PlayerComponent implements AfterViewInit, OnDestroy {

  @ViewChild('playerContainer', { static: true }) playerContainer!: ElementRef;
  @ViewChild('backgroundMusic', { static: true }) backgroundMusic!: ElementRef;
  private player: any;
  private backgroundPlayer: any;
  sub!: Subscription;
  iframe: any;
  isPlaying = false;
  switching = false;

  constructor(private el: ElementRef, private renderer: Renderer2, private playerService: PlayerService, private stateService: StateService) {}

  ngAfterViewInit() {
    // Проверяем, если API уже загружен
    if ((window as any).YT && (window as any).YT.Player) {
      this.initPlayer();
    } else {
      // Ждём загрузки API
      (window as any).onYouTubeIframeAPIReady = () => {
        this.initPlayer();
      };
    }
  }

  ngOnDestroy() {
    if (this.player) {
      this.player.destroy();
    }
    this.sub.unsubscribe();
  }

  private initPlayer() {
    this.player = new (window as any).YT.Player(this.playerContainer.nativeElement, {
      videoId: 'xat1GVnl8-k',
      playerVars: {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 1,
        cc_load_policy: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: () => {
          this.player.setVolume(0);
          this.playerService.$init.next(true);
          const iframe = document.querySelector('app-player > iframe') as HTMLIFrameElement;
          iframe.style.width = `170%`;
          iframe.style.height = `220%`;
          this.sub = this.playerService.$video.subscribe((video) => {
            this.play(video);
          });
          this.sub = this.playerService.$stop.subscribe(() => {
            this.stop();
          });
        },
      }
    });
    this.backgroundPlayer = new (window as any).YT.Player(this.backgroundMusic.nativeElement, {
      videoId: 'PJxxfilLnGI',
      playerVars: {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 1,
        cc_load_policy: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: () => {
          this.backgroundPlayer.setVolume(0);
          this.backgroundPlayer.seekTo(930, true);
          // const iframe = document.querySelector('.background-player > iframe') as HTMLIFrameElement;
          this.increaseVolume(false, false);
          this.backgroundPlayer.playVideo();
        },
        onStateChange: (event: any) => {
          if (event.data === 0){
            this.backgroundPlayer.seekTo(930, true);
          }
        },
      }
    });

  }

  private play(video: ISong) {
    const {id , start}  = video;
    this.player.loadVideoById(id);
    this.player.playVideo();
    setTimeout(() => {
      this.player.seekTo(start, true);

      this.increaseVolume(true, true);
      this.increaseVisibility();
    }, environment.playerDelay * 1000);
  }

  stop(){
    this.decreaseVolume(true, true);
    this.decreaseVisibility();
    setTimeout(() => {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
      this.player.stopVideo();
    }, (100/environment.videoStep) * environment.videoStepDuration)
  }

  increaseVolume(main: boolean, switching: boolean) {
    if(!main){
      this.backgroundPlayer.playVideo()
    }
    if(switching){
      this.decreaseVolume(!main, false);
    }
    const player = main ? this.player : this.backgroundPlayer;
    let currentVolume = 0;
    const interval = setInterval(() => {
      if (currentVolume < (main ? 100 : environment.backgroundVolume)) {
        currentVolume += environment.videoStep;
        player.setVolume(currentVolume);
      } else {
        clearInterval(interval);
      }
    }, environment.videoStepDuration);
  }

  decreaseVolume(main: boolean, switching: boolean) {
    if(switching){
      this.increaseVolume(!main, false);
    }
    const player = main ? this.player : this.backgroundPlayer;
    let currentVolume = player.getVolume();
    const interval = setInterval(() => {
      if (currentVolume > 0) {
        currentVolume -= environment.videoStep;
        player.setVolume(currentVolume);
      } else {
        if(!main){
          this.backgroundPlayer.pauseVideo();
        }
        clearInterval(interval);
      }
    }, environment.videoStepDuration);
  }

  decreaseVisibility() {
    let currentVisibility = 100;
    const interval = setInterval(() => {
      if (currentVisibility > 0) {
        currentVisibility -= environment.videoStep;
        this.renderer.setStyle(this.el.nativeElement, 'opacity', String(currentVisibility / 100));
      } else {
        clearInterval(interval);
      }
    }, environment.videoStepDuration);
  }

  increaseVisibility() {
    let currentVisibility = 0;
    const interval = setInterval(() => {
      if (currentVisibility < 100) {
        currentVisibility += environment.videoStep * 2;
        this.renderer.setStyle(this.el.nativeElement, 'opacity', String(currentVisibility / 100));
      } else {
        clearInterval(interval);
      }
    }, environment.videoStepDuration);
  }

}

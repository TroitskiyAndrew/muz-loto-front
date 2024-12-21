import { AfterViewInit, Component, ElementRef, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { PlayerService } from '../../services/player.service';
import { IGameVideo, IVideo } from '../../models/models';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrl: './player.component.scss'
})
export class PlayerComponent implements AfterViewInit, OnDestroy {

  @ViewChild('playerContainer', { static: true }) playerContainer!: ElementRef;
  private player: any;
  sub!: Subscription;

  constructor(private el: ElementRef, private renderer: Renderer2, private playerService: PlayerService) {}

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
        fs: 0,
        cc_load_policy: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: () => {
          this.player.setVolume(0);
          this.playerService.$init.next(true);
          this.sub = this.playerService.$video.subscribe((video) => {
            this.play(video);
          })
        },
      }
    });


  }

  private play(video: IGameVideo) {
    const {id , start, duration}  = video;
    this.player.loadVideoById(id);
    this.player.playVideo();
    const endTime = environment.playerDelay + duration;
    setTimeout(() => {
      this.player.seekTo(start, true);
      this.increaseVolume();
      this.increaseVisibility();
    }, environment.playerDelay * 1000);

    setTimeout(() => {
      this.decreaseVolume();
      this.decreaseVisibility();
    }, endTime * 1000 - ((100/environment.videoStep) * environment.videoStepDuration ));

    setTimeout(() => {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
      this.player.stopVideo();
    }, endTime * 1000)
  }

  increaseVolume() {
    let currentVolume = 0;
    const interval = setInterval(() => {
      if (currentVolume < 100) {
        currentVolume += environment.videoStep;
        this.player.setVolume(currentVolume);
      } else {
        clearInterval(interval);
      }
    }, environment.videoStepDuration);
  }

  decreaseVolume() {
    let currentVolume = 100;
    const interval = setInterval(() => {
      if (currentVolume > 0) {
        currentVolume -= environment.videoStep;
        this.player.setVolume(currentVolume);
      } else {
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

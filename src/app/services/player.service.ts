import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { IBackgroundMusic, ISong, ISongForPlayer } from '../models/models';
import { DEFAULT_BACKGROUND_MUSIC } from '../constants/constants';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  public $video = new Subject<ISongForPlayer>();

  public $init = new BehaviorSubject<boolean>(false);

  public $initMain = new BehaviorSubject<boolean>(false);
  public $initBackGround = new BehaviorSubject<boolean>(false);

  public $stop = new Subject<boolean>();
  public $playBackGround = new Subject<IBackgroundMusic>();
  public $stopBackGround = new Subject<void>();
  public backgroundMusic:IBackgroundMusic = DEFAULT_BACKGROUND_MUSIC;
  public gameMode = false;
  public initPlayers$ = new Subject<void>();

  constructor() {
    combineLatest([this.$initMain, this.$initBackGround]).subscribe(
      ([main, background]) => {
        this.$init.next(main && background);
      }
    );
  }

  play(song: ISong){
    this.$video.next(song);
    return new Promise<boolean>((resolve) => {
      const sub = this.$stop.subscribe((fomPlayer) => {
        sub.unsubscribe();
        resolve(fomPlayer);
      })
    })
  }

  stop(fomPlayer: boolean){
    this.$stop.next(fomPlayer)
  }

  playBackGround(backgroundMusic?: IBackgroundMusic){
    this.$playBackGround.next(backgroundMusic || this.backgroundMusic);
  }
  stopBackGround(){
    this.$stopBackGround.next();
  }

  initPlayers(){
    if(this.$init.getValue()){
      return;
    }
    this.initPlayers$.next();
    return new Promise<void>(resolve => {
      const sub = this.$init.subscribe(val => {
        if(val){
          setTimeout(() => sub.unsubscribe());
          resolve()
        }
      })
    })
  }
}

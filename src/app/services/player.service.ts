import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { IBackgroundMusic, ISong } from '../models/models';
import { DEFAULT_BACKGROUND_MUSIC } from '../constants/constants';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  public $video = new Subject<ISong>();
  public $init = new BehaviorSubject<boolean>(false);
  public $stop = new Subject();
  public $playBackGround = new Subject<IBackgroundMusic>();
  public backgroundMusic:IBackgroundMusic = DEFAULT_BACKGROUND_MUSIC;
  public gameMode = false;

  constructor() { }

  play(song: ISong){
    this.$video.next(song);
    return new Promise<void>((resolve) => {
      const sub = this.$stop.subscribe(() => {
        sub.unsubscribe();
        resolve();
      })
    })
  }

  simulatePlay(){
    return new Promise<void>((resolve) => {
      const sub = this.$stop.subscribe(() => {
        sub.unsubscribe();
        resolve();
      })
    })
  }

  stop(){
    this.$stop.next(undefined)
  }

  playBackGround(backgroundMusic?: IBackgroundMusic){
    this.$playBackGround.next(backgroundMusic || this.backgroundMusic);
  }


}

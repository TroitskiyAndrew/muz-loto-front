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
  public $playBackGround = new BehaviorSubject<IBackgroundMusic | null>(null);
  public $stopBackGround = new Subject<void>();
  public backgroundMusic:IBackgroundMusic = DEFAULT_BACKGROUND_MUSIC;
  public gameMode = false;
  public $startInit = new Subject<boolean>();

  constructor() {}

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

}

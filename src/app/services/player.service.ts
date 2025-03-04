import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ISong } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  public $video = new Subject<ISong>();
  public $init = new BehaviorSubject<boolean>(false);
  public $stop = new Subject();
  public isPlaying = false;

  constructor() { }


}

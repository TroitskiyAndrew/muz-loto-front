import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { IGameVideo, IVideo } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  public $video = new Subject<IGameVideo>();
  public $init = new BehaviorSubject<boolean>(false);

  constructor() { }


}

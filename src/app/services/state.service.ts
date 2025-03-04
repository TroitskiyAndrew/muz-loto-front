import { Injectable } from '@angular/core';
import {
  IGameSettings,
  IRoundSettings,
} from '../models/models';
import { environment } from '../../environments/environment';
import { extractTimestamp, extractVideoId } from '../utils/utils';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  public showCards = false;
  public logo = 'weli';


  constructor() { }

}


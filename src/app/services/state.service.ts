import { Injectable } from '@angular/core';
import {
  IGame,
  IGameSettings,
  IRoundSettings,
  ITicket,
  IUser,
} from '../models/models';
import { environment } from '../../environments/environment';
import { extractTimestamp, extractVideoId } from '../utils/utils';
import { Subject } from 'rxjs';
import { DEFAULT_BACKGROUND_MUSIC } from '../constants/constants';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root',
})
export class StateService {
  public showCards = false;
  gameCode = "";
  user: IUser | null = null;
  $init = new Subject<boolean>();
  showHome = true;

  constructor() {}

  setUser(user: IUser){
    this.user = user;
  }

}


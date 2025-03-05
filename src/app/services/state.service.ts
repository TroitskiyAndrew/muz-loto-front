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

// ToDo Временная возня, так как билеты слишком тяжелые для пересылки
interface TicketsHolder {
  [key: string]: ITicket[];
}

@Injectable({
  providedIn: 'root',
})
export class StateService {
  public showCards = false;
  public logo = 'weli';
  gameCode = "";
  user: IUser | null = null;
  $init = new Subject<boolean>();
  ticketsHolder: TicketsHolder = {};

  constructor() {
    const ticketsHolderString = localStorage.getItem('ticketsHolder');
    if(ticketsHolderString){
      this.ticketsHolder = JSON.parse(ticketsHolderString)
    }
  }

  setUser(user: IUser){
    this.user = user;
  }

}


import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ICredentials,
  IGame,
  IAuthResponse,
  INewSong,
  INewUser,
  ISong,
  IUser,
  INewGame,
  ITicket,
  INewGameTickets,
  GameUpdate,
} from '../models/models';
import { environment } from '../../environments/environment';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient, private stateService: StateService) {}

  auth(credentials: ICredentials) {
    const url = `${environment.backendUrl}/auth`;
    return this.http
      .post<IAuthResponse>(url, credentials)
      .toPromise().then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  getUser() {
    const url = `${environment.backendUrl}/users`;
    return this.http
      .get<IUser>(url)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  createUser(newUser: INewUser) {
    const url = `${environment.backendUrl}/users`;
    return this.http
      .post<IAuthResponse>(url, newUser)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }


  getGame(code: string) {
    const url = `${environment.backendUrl}/gameByCode/${code}`;
    return this.http
      .get<IGame>(url)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  getGames() {
    const url = `${environment.backendUrl}/games`;
    return this.http
      .get<IGame[]>(url)
      .toPromise()
      .then(res => res || [])
      .catch((error) => {
        console.log(error);
        return [] as IGame[];
      });
  }

  updateGame(game: GameUpdate) {
    const url = `${environment.backendUrl}/games`;
    return this.http
      .put(url, game)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  createGame(game: INewGame) {
    const url = `${environment.backendUrl}/games`;
    return this.http
      .post<IGame>(url, game)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  getSongs() {
    const url = `${environment.backendUrl}/songs`;
    return this.http
      .get<ISong[]>(url)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  updateSong(song: ISong) {
    const url = `${environment.backendUrl}/users`;
    return this.http
      .put(url, song)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  updateSongs(songs: ISong[], gameId: string) {
    const url = `${environment.backendUrl}/users`;
    return this.http
      .put(url, {gameId, songIds: songs.map(song => song.id)})
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  createSong(song: INewSong | INewSong[]) {
    const url = `${environment.backendUrl}/songs`;
    return this.http
      .post<INewSong | INewSong[]>(url, song)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  deleteSong(id: string) {
    const url = `${environment.backendUrl}/songs/${id}`;
    return this.http
      .delete(url)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  getTickets(gameId: string) {
    return this.getTicketsBatch(gameId, []);
  }

  getTicketsBatch(gameId: string, acc: ITicket[]): Promise<ITicket[]>{
    const url = `${environment.backendUrl}/tickets/${gameId}`;
    return this.http
      .get<{isMore: boolean; tickets: ITicket[]}>(url)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      }).then((res) => {
        acc.push(...(res?.tickets  || []));
        if (res?.isMore){
          return this.getTicketsBatch(gameId, acc)
        } else {
          return acc;
        }
      });
  }

  createTickets(gameId: string, tickets: ITicket[], add: boolean) {
    return this.sendTicketsBatch(gameId, tickets, [], add ? 1 : 0);
  }

  sendTicketsBatch(gameId: string, tickets: ITicket[], acc: ITicket[], step: number): Promise<ITicket[]>{
    const ticketsToSend = tickets.splice(0, 3);
    acc.push(...ticketsToSend);
    const url = `${environment.backendUrl}/tickets/${gameId}`;
    return (step === 0 ? this.http
      .post<ITicket[]>(url, ticketsToSend) : this.http
      .put<ITicket[]>(url, ticketsToSend))
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      }).then(() => {
        if(tickets.length){
          return this.sendTicketsBatch(gameId, tickets, acc, ++step);
        } else {
          return acc;
        }
      });
  }
}

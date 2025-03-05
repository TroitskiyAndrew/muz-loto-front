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
} from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  auth(credentials: ICredentials) {
    const url = `${environment.backendUrl}/auth`;
    console.log(url);
    return this.http
      .post<IAuthResponse>(url, credentials)
      .toPromise().then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  getUser(id: string) {
    const url = `${environment.backendUrl}/users/${id}`;
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
    const url = `${environment.backendUrl}/new-user`;
    return this.http
      .post<IAuthResponse>(url, newUser)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  updateUser(user: IUser) {
    const url = `${environment.backendUrl}/users`;
    return this.http
      .put<IAuthResponse>(url, user)
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
      .get(url)
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
      .get(url)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  updateGame(game: Pick<IGame, 'results'>) {
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

  getTickets() {
    const url = `${environment.backendUrl}/tickets`;
    return this.http
      .get<ITicket[]>(url)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }

  createTickets(tickets: INewGameTickets) {
    const url = `${environment.backendUrl}/tickets`;
    return this.http
      .post<ITicket[]>(url, tickets)
      .toPromise()
      .then(res => res || null)
      .catch((error) => {
        console.log(error);
        return null;
      });
  }
}

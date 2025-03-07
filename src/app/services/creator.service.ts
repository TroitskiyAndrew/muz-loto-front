import { Injectable } from '@angular/core';
import {
  IGameSettings,
  ISong,
  ISongWithSettings,
  IGame,
  IRoundSettings,
  IRoundSong,
  ITicket,
  Winner,
  INewGame,
} from '../models/models';
import { StateService } from './state.service';
import { DEFAULT_BACKGROUND_MUSIC } from '../constants/constants';
import { SongsService } from './songs.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class CreatorService {

  constructor(private stateService: StateService, private songsService: SongsService, private apiService: ApiService) {}

  public async generateGame(songs: ISongWithSettings[], settings: IGameSettings): Promise<IGame> {
    const {mandatorySongs, usualSongs} = songs.reduce((result, song) => {
      if(song.disabled){
        return result;
      }
      if(song.round != null && song.round > 0 && song.round <= settings.rounds.length){
        result.mandatorySongs.push(song);
      } else {
        result.usualSongs.push(song);
      }
      return result;
    }, {mandatorySongs: [] as ISongWithSettings[], usualSongs : [] as ISongWithSettings[]})

    const randomizedMandatorySongs = mandatorySongs
      .sort(() => Math.random() - 0.5);
    const randomizedUsualSongs = usualSongs
      .sort(() => Math.random() - 0.5);
    const prioritySongs = randomizedUsualSongs.filter((song) => song.priority);
    const nonPrioritySongs = randomizedUsualSongs.filter((song) => !song.priority);
    const usedSongs = new Set<string>(randomizedMandatorySongs.map(song => song.id));
    const game: INewGame =  {
      owner: this.stateService.user?.id || '',
      rounds: settings.rounds.map((round, index) => {
        const mandatorySongsForRound = randomizedMandatorySongs.filter(song => song.round === index + 1)
        const usedArtists = new Set<string>(mandatorySongsForRound.map(song => song.artist));
        const songs: ISong[] = [...mandatorySongsForRound];
        this.addSongs(songs, prioritySongs, usedSongs, usedArtists, round);
        this.addSongs(songs, nonPrioritySongs, usedSongs, usedArtists, round);
        if (songs.length !== round.roundFieldColumns * round.roundFieldRows) {
          alert('Количество песен не совпадает');
        }
        songs.sort(() => Math.random() - 0.5);
        const roundSongs: IRoundSong[] = songs.map((song, index) => ({
          ...song,
          number: index,
          class: '',
          played: false,
        }));
        const field: IRoundSong[][] = [];
        let songIndex = 0;
        for (let rowIndex = 0; rowIndex < round.roundFieldRows; rowIndex++) {
          const row = [];
          for (
            let columnIndex = 0;
            columnIndex < round.roundFieldColumns;
            columnIndex++
          ) {
            row.push(roundSongs[songIndex++]);
          }
          field.push(row);
        }

        return {
          name: `Раунд №${index + 1}`,
          field,
          [Winner.Line]: {
            count: round.lineWinners,
            tickets: [],
            from: 8,
            to: 11,
          },
          [Winner.Cross]: {
            count: round.crossWinners,
            tickets: [],
            from: 15,
            to: 25,
          },
          [Winner.All]: {
            count: round.allWinners,
            tickets: [],
            from: 35,
            to: 38,
          },
        };
      }),
      ticketsCount: settings.tickets,
      backgroundMusic: settings.backgroundMusic,
      code: this.generateCode(),
      results: {
        lastStart: null,
        wantedWinner: Winner.Line,
        gameWinners: [],
        wastedTickets: [],
        rounds: [],
      },
    };
    const createdGame = await this.apiService.createGame(game);
    if(!createdGame){
      throw new Error('Не смог создать игру')
    }
    return createdGame;
  }

  generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
  private addSongs(
    result: ISong[],
    songs: ISongWithSettings[],
    usedSongs: Set<string>,
    usedArtists: Set<string>,
    round: IRoundSettings
  ): ISong[] {
    let rusSongsNeed =
      round.roundFieldRows * round.roundFieldColumns -
      round.notRusSongs -
      result.filter((song) => song.rus).length;
    let notRusSongsNeed =
      round.notRusSongs - result.filter((song) => !song.rus).length;
    songs.forEach((song) => {
      if (!usedSongs.has(song.id) && !usedArtists.has(song.artist)) {
        if (song.rus && rusSongsNeed) {
          result.push(song);
          rusSongsNeed--;
          usedSongs.add(song.id);
          usedArtists.add(song.artist);
        }
        if (!song.rus && notRusSongsNeed) {
          result.push(song);
          notRusSongsNeed--;
          usedSongs.add(song.id);
          usedArtists.add(song.artist);
        }
      }
    });
    return result;
  }

  public async generateTickets(game: IGame, settings: IGameSettings): Promise<ITicket[]> {
    const result: ITicket[] = [];
    for (let ticketIndex = 0; ticketIndex < settings.tickets; ticketIndex++) {
      const ticket: ITicket = {
        number: ticketIndex + 1,
        rounds: [],
      };
      for (let roundIndex = 0; roundIndex < settings.rounds.length; roundIndex++) {
        const field = [];
        const roundSettings = settings.rounds[roundIndex];
        if (!roundSettings) {
          alert('Нет настроек для раунда');
        }

        if (
          roundSettings.ticketFieldColumns * roundSettings.ticketFieldRows >
          game.rounds[roundIndex].field.flat().length
        ) {
          alert('В билете не может быть больше песен');
        }
        const songs = [...game.rounds[roundIndex].field.flat()].sort(
          () => Math.random() - 0.5
        );

        let songIndex = 0;
        for (
          let rowIndex = 0;
          rowIndex < roundSettings.ticketFieldRows;
          rowIndex++
        ) {
          const row = [];
          for (
            let columnIndex = 0;
            columnIndex < roundSettings.ticketFieldColumns;
            columnIndex++
          ) {
            row.push(songs[songIndex++]);
          }
          field.push(row);
        }
        ticket.rounds.push({ field });
      }

      result.push(ticket);
    }
    return this.apiService.createTickets(game.id, result) || [];
  }

}


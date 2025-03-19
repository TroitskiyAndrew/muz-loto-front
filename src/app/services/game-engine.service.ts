import { Injectable } from '@angular/core';
import { BASE_DEEP } from '../constants/constants';
import { IRoundTicket, IWinnersSettings, Weight, Winner } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class GameEngineService {
  boost = 1000;

  constructor() { }

  selectSong(roundTickets: IRoundTicket[], gameWinners: number[],
    winnersSettings: IWinnersSettings | null, availableSongsIds: string[], playedSongs: string[], wantedWinner: Winner | null): string {
    const step = playedSongs.length + 1;
    const deep = BASE_DEEP + Math.floor(step / 10);
    const weights = this.getWeights(roundTickets, gameWinners,
      winnersSettings, deep, availableSongsIds, playedSongs, wantedWinner);
    const selectedWeight = weights.sort((a, b) => b.weight - a.weight)[0];
    return selectedWeight.songId;
  }

  getWeights(roundTickets: IRoundTicket[], gameWinners: number[],
    winnersSettings: IWinnersSettings | null, deep: number, availableSongsIds: string[], playedSongs: string[], wantedWinner: Winner | null): Weight[] {
    const weights = [];
    const songs = availableSongsIds.sort(() => Math.random() - 0.5);
    for (const songId of songs) {
      const weight = this.getWeightsForSong(
        roundTickets,
        gameWinners,
        winnersSettings,
        songId,
        songs,
        playedSongs,
        wantedWinner,
        deep
      );
      weights.push({ songId, weight });
    }
    return weights;
  }

  getWeightsForSong(
    roundTickets: IRoundTicket[],
    gameWinners: number[],
    winnersSettings: IWinnersSettings | null,
    songId: string,
    songs: string[],
    playedSongs: string[],
    wantedWinner: Winner | null,
    deep: number
  ): number {
    const step = playedSongs.length + 1;
    if (
      step <= 7 ||
      wantedWinner === null ||
      deep === 0
    ) {
      return 1;
    }
    const restOfSongs = songs.filter((song) => song !== songId);
    if (!songs.length) {
      return -this.boost;
    }
    const stepWinners = this.getWinners(roundTickets, songId, playedSongs, wantedWinner);
    const weight = this.getResultWeight(stepWinners, gameWinners, winnersSettings!);
    if (weight != null) {
      return weight;
    }

    let success = 0;
    --deep;
    for (const subSongId of restOfSongs) {
      const weight = this.getWeightsForSong(
        roundTickets,
        gameWinners,
        winnersSettings,
        subSongId,
        restOfSongs,
        [...playedSongs, songId],
        deep,
        wantedWinner
      );
      success += weight;
    }
    return success / songs.length;
  }

  getWinners(roundTickets: IRoundTicket[], selectedSongId: string, playedSongs: string[], wantedWinner: Winner | null): number[] {
    return roundTickets.reduce((result, ticket) => {
      const isWinner = this.trySongInTicket(
        selectedSongId,
        ticket,
        playedSongs,
        wantedWinner,
      );
      if (isWinner) {
        result.push(ticket.number);
      }
      return result;
    }, [] as number[]);
  }

  trySongInTicket(
    songId: string,
    ticket: IRoundTicket,
    playedSongs: string[],
    wantedWinner: Winner | null,
  ): boolean {
    let result = false;
    const linesSimulation = ticket.field.map(
      (row) =>
        new Set(
          row
            .filter((song) => !playedSongs.includes(song.id))
            .map((song) => song.id)
        )
    );
    for (
      let columnIndex = 0;
      columnIndex < ticket.field.length;
      columnIndex++
    ) {
      linesSimulation.push(
        new Set(
          ticket.field
            .filter((row) => !playedSongs.includes(row[columnIndex].id))
            .map((row) => row[columnIndex].id)
        )
      );
    }
    const horizontalLines = linesSimulation.slice(
      0,
      linesSimulation.length / 2
    );
    const verticalLines = linesSimulation.slice(linesSimulation.length / 2);
    const verticalWin = verticalLines.some(
      (line) => line.has(songId) && line.size === 1
    );
    const horizontalWin = horizontalLines.some(
      (line) => line.has(songId) && line.size === 1
    );
    if (
      wantedWinner === Winner.Line &&
      (verticalWin || horizontalWin)
    ) {
      result = true;
    }
    if (
      wantedWinner === Winner.Cross &&
      verticalWin &&
      horizontalWin
    ) {
      result = true;
    }
    if (wantedWinner === Winner.All) {
      const rest = new Set(
        [...verticalLines, ...horizontalLines].map((s) => [...s]).flat()
      );
      if (rest.has(songId) && rest.size === 1) {
        result = true;
      }
    }
    return result;
  }

  getResultWeight(stepWinners: number[], gameWinners: number[], winnersSettings: IWinnersSettings): number | null {
    const winnersArray = Array.from(stepWinners);
    const { count } = winnersSettings;
    if (
      winnersArray.length > count ||
      winnersArray.some((winner) => gameWinners.includes(winner))
    ) {
      return -this.boost * 10;
    }

    // if (
    //   tickets.length &&
    //   winnersArray.length === count &&
    //   winnersArray.every((winner) => tickets.includes(winner))
    // ) {
    //   return this.boost * 1000;
    // }
    if (winnersArray.length === count) {
      let result = this.boost--;
      if (this.boost === 501) {
        this.boost = 1000;
      }
      return result;
    }
    return null;
  }
}

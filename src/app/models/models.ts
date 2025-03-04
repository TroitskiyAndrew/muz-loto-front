export interface IGameSettings {
  doubleWin: boolean;
  logo: string;
  rounds: IRoundSettings[];
}

export interface IRoundSettings {
  roundFieldColumns: number;
  roundFieldRows: number;
  playerFieldColumns: number;
  playerFieldRows: number;
  lineWinners: number;
  crossWinners: number;
  allWinners: number;
  doubleWin: boolean;
  notRusSongs: number,
}

export interface ISong {
  artist: string,
  name: string;
  rus: boolean;
  id: string;
  start: number;
}

export type ISongWithSettings = ISong & {
  priority: boolean;
  disabled: boolean;
}

export type NEW_IRoundSong = ISong & {
  number: number;
  class: string;
  played: boolean;
}


export interface NEW_IGame {
  id: string;
  rounds: NEW_IRound[]
}

export interface NEW_IRound {
  name: string;
  field: NEW_IRoundSong[][]
}

export type NEW_IPlayingRound = NEW_IRound & {
  //ToDo брать из настроек
  [Winner.Line]: IWinnersSettings;
  [Winner.Cross]: IWinnersSettings;
  [Winner.All]: IWinnersSettings;
}

export interface IWinnersSettings {
  count: number;
  tickets: number[];
  from: number;
  to: number;
}
export interface NEW_IGameSettings {
  rounds: NEW_IRoundSettings[];
}

export interface NEW_IRoundSettings {
  roundFieldColumns: number,
  roundFieldRows: number,
  notRusSongs: number,
}

export interface NEW_ITicketsSettings {
  count: number,
  rounds: NEW_IRoundTicketsSettings[],
}

export interface NEW_IRoundTicketsSettings {
  ticketFieldColumns: number,
  ticketFieldRows: number,
}

export interface NEW_ITicket {
  number: number;
  rounds: NEW_ITicketRound[];
}

export interface NEW_ITicketRound {
  field: NEW_IRoundSong[][];
}

export type NEW_IPlayingTicketRound = Pick<NEW_ITicket, 'number'> & NEW_ITicketRound;

export enum Winner {
  Line,
  Cross,
  All,
}

export interface Weight {
  songId: string;
  weight: number;
}

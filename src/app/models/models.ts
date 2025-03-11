import { TemplateRef } from "@angular/core";
import { FormControl } from "@angular/forms";

export interface IGameSettings {
  tickets: number;
  backgroundMusic: IBackgroundMusic;
  testGame: boolean;
  rounds: IRoundSettings[];
}

export interface IBackgroundMusic {
  youtubeId: string;
  start: number;
}

export interface IRoundSettings {
  roundFieldColumns: number;
  roundFieldRows: number;
  ticketFieldColumns: number;
  ticketFieldRows: number;
  lineWinners: number;
  crossWinners: number;
  allWinners: number;
  notRusSongs: number,
}

export interface ISong {
  id: string;
  artist: string,
  name: string;
  rus: boolean;
  youtubeId: string;
  start: number;
  games: string[];
}

export type INewSong  = Omit<ISong, 'id'>

export type ISongWithSettings = ISong & {
  priority: boolean;
  disabled: boolean;
  round: number | undefined
}

export type IRoundSong = ISong & {
  number: number;
  class: string;
  played: boolean;
}


export interface IGame {
  id: string;
  code: string;
  owner: string;
  testGame: boolean;
  rounds: IRound[];
  results: IGameResults;
  ticketsCount: number;
  logo: string;
  backgroundMusic: IBackgroundMusic;
}

export type GameUpdate = Partial<IGame> & Pick<IGame, 'id'>

export interface IGameTickets {
  id: string;
  gameId: string;
  tickets: ITicket[];
}

export type INewGameTickets  = Omit<IGameTickets, 'id'>

export type INewGame  = Omit<IGame, 'id'>

export interface IGameResults {
  lastStart: string | null;
  wantedWinner: Winner | null;
  gameWinners: number[];
  wastedTickets: number[];
  rounds: IRoundResults[];
  currentRoundIndex: number;
  currentStep: number;
}

export interface IRoundResults {
  playedSongs: string[]
}

export interface IRound {
  name: string;
  field: IRoundSong[][];
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


export interface ITicket {
  number: number;
  rounds: ITicketRound[];
}

export interface ITicketRound {
  field: IRoundSong[][];
}

export type IPlayingTicket = Pick<ITicket, 'number'> & ITicketRound;


export interface Weight {
  songId: string;
  weight: number;
}

export enum Winner {
  Line,
  Cross,
  All,
}

export enum SocketMessageType {
  Player = 'playerMessage',
  Modal = 'modalMessage',
  Game = 'gameMessage',
  Tickets = 'ticketsMessage',
}

export interface SocketMessage<T> {
  type: SocketMessageType;
  gameCode: string;
  data: T;
}

export interface TicketsMessagePayload {
  exclude: boolean,
  tickets: number[];
}

export type SocketCallback<T> = (data: SocketMessage<T>) => void

export type Callbacks = {
  [key in SocketMessageType]: SocketCallback<any>
}

export interface ICredentials {
  email: string;
  hashedPassword: string;
}
export interface IUser {
  id: string;
  email: string;
  logo: string;
  gamesCredit: number;
  backgroundMusic: IBackgroundMusic;
}

export type INewUser  = Omit<IUser, 'id' | 'gamesCredit'> & {hashedPassword: string}

export interface IAuthResponse {
  user: IUser;
  token: string;
}

export interface IDialogField {
  id: string;
  label: string;
  control: FormControl,
  type?: HTMLInputElement['type'],
}

export interface IDialogButton {
  label: string;
  action: () => Promise<any> | any;
  disabled: () => boolean;
  class?: string
}

export interface DialogData {
  init?: () => void;
  title?: string;
  message?: string;
  errorMessage?: string;
  fields?: IDialogField[];
  buttons: IDialogButton[];
  template?: TemplateRef<any>;
}


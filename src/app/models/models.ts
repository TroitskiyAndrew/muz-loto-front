import { TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';

export interface IGameSettings {
  tickets: number;
  backgroundMusic: IBackgroundMusic;
  testGame: boolean;
  rounds: IRoundSettings[];
  comment: string;
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
  notRusSongs: number;
}

export interface ISong {
  id: string;
  artist: string;
  name: string;
  rus: boolean;
  youtubeId: string;
  start: number;
  games: string[];
  owner?: string;
}

export type ISongForPlayer = Pick<ISong, 'youtubeId' | 'start'>;

export type INewSong = Omit<ISong, 'id'>;

export interface ISongPreferences {
  priority: boolean;
  disabled: boolean;
  round: number | undefined;
}
export type ISongWithParams = ISong &
  ISongPreferences & {
    history: ISongHistory[];
  };

export type IDisplaySong = Omit<ISongWithParams, 'history'> & {
  lastUsage: string;
  usageCount: number;
  pending: boolean;
};

export interface ISongHistory {
  code: string;
  lastStart: string;
  round: number;
}

export type IRoundSong = ISong & {
  number: number;
  class: string;
  played: boolean;
};

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
  comment: string;
}

export type GameUpdate = Partial<IGame> & Pick<IGame, 'id'>;

export interface IGameTickets {
  id: string;
  gameId: string;
  tickets: ITicket[];
}

export type INewGameTickets = Omit<IGameTickets, 'id'>;

export type INewGame = Omit<IGame, 'id'>;

export interface INewGameParams {
  game: INewGame;
  songsPreferences: ({ id: string } & ISongPreferences)[];
  usedSongs: IUsedSongs[];
}

export interface IUsedSongs {
  id: string;
  round: number;
}

export interface IGameResults {
  lastStart: string | null;
  gameWinners: number[];
  playingTicketsNumbers: number[];
  rounds: IRoundResults[];
  currentRoundIndex: number;
  stepWinners: number[];
}

export interface IRoundResults {
  playedSongs: string[];
  wantedWinner: Winner | null;
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

export type IRoundTicket = Pick<ITicket, 'number'> & ITicketRound;

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
  socketId: string;
  data: T;
}

export interface TicketsMessagePayload {
  exclude: boolean;
  tickets: number[];
}

export enum GameMessageType {
  AskPlayingTicketsCount,
  AnswerPlayingTicketsCount,
  StartRound,
  StopRound,
  StartStep,
  FinishStep,
  AskWinners,
  AnswerWinners,
  SubmitWinners,
  ChangeTickets,
  BlockStopStep
}

export type GameMessagePayload =
  | {
      type:
        | GameMessageType.AskPlayingTicketsCount
        | GameMessageType.AskWinners
        | GameMessageType.AnswerWinners
        | GameMessageType.StartStep
        | GameMessageType.FinishStep;
    }
  | { type: GameMessageType.AnswerPlayingTicketsCount; count: number }
  | { type: GameMessageType.StartRound; roundIndex: number }
  | { type: GameMessageType.StopRound; next: boolean }
  | { type: GameMessageType.BlockStopStep; block: boolean }
  | { type: GameMessageType.ChangeTickets, newPlayingTickets: number[] }
  | ISubmitWinnersResultMessagePayload
  | IStepResultsMessagePayload;

  export type IStepResultsMessagePayload = { type: GameMessageType.StartStep } & IStepResults;
  export type ISubmitWinnersResultMessagePayload = { type: GameMessageType.SubmitWinners } & ISubmitWinnersResults;

export interface IStepResults {
  stepWinners: number[], selectedSongId: string, newLastStart: string
}

export interface ISubmitWinnersResults {
  newWinners: number[]; wantedWinner: Winner | null, wastedTickets: number[]
}
export interface IChangeTicketsResults {
  tickets: number[], add: boolean
}

export enum PlayerMessageType {
  PlaySong,
  StopSong,
}

export type PlayerMessagePayload =
  | {
      type: PlayerMessageType.StopSong;
    }
  | {
      type: PlayerMessageType.PlaySong;
      songId: string;
      randomizedSongsIds: string[];
    };

export type SocketCallback<T> = (data: SocketMessage<T>) => void;

export type Callbacks = {
  [key in SocketMessageType]: SocketCallback<any>;
};

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
  isAdmin: boolean;
}

export type INewUser = Omit<IUser, 'id' | 'gamesCredit' | 'isAdmin'> & {
  hashedPassword: string;
};

export interface IAuthResponse {
  user: IUser;
  token: string;
}

export interface IDialogField {
  id: string;
  label: string;
  control: FormControl;
  type?: HTMLInputElement['type'];
}

export interface IDialogButton {
  label: string;
  action: () => Promise<any> | any;
  disabled: () => boolean;
  class?: string;
}

export interface DialogData {
  init?: (dialogId?: number) => void;
  title?: string;
  message?: string;
  errorMessage?: string;
  fields?: IDialogField[];
  buttons: IDialogButton[];
  template?: TemplateRef<any>;
  disableClose?: boolean;
}

export interface IGameServiceInitParams {
  isFront: boolean;
  game?: IGame;
  code?: string;
}

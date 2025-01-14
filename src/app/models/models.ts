export interface IVideo {
  url: string;
  name: string;
  priority: boolean;
}

export type IGameVideo = Omit<IVideo, 'url'> & {
  number: number;
  start: number;
  played: boolean;
  class: string;
  id: string;
  priority: boolean
}

export interface IRound {
  name: string;
  roundFieldColumns: number,
  roundFieldRows: number,
  playerFieldColumns: number,
  playerFieldRows: number,
  players: IPlayer[];
  videos: IVideo[];
  fields: IFieldCell[][];
  lineWinners: number;
  crossWinners: number;
  allWinners: number;
  doubleWin: boolean,
}

export type IGameRound = Omit<IRound, 'videos'> & {
  videos: Set<IGameVideo>;
  active: boolean;
  steps: string[];
  savedSteps: string[];
  winners: IPlayer[];
}

export interface IGame {
  doubleWin: boolean;
  rounds: IRound[];
}

export interface IReadyGame {
  id: number,
  doubleWin: boolean,
  winners:  Set<number>;
  rounds: IGameRound[];
}

export interface IFieldCell {
  videoId: string;
  name: string;
}

export interface IPlayer {
  number: number;
  fields: IFieldCell[][];
  lines: Set<string>[];
  linesSimulation: Set<string>[];
}

export enum Win {
  FirstLine = 'FirstLine',
  Cross = 'Cross',
  All = 'All',
}

export interface IWinner {
  type: Win;
  player: IPlayer;
  step: number
}

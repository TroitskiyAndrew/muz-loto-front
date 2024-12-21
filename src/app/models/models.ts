export interface IVideo {
  url: string;
  name: string;
  duration: number;
}

export type IGameVideo = Omit<IVideo, 'url'> & {
  start: number;
  played: boolean;
  selected: boolean;
  id: string;
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
}

export type IGameRound = Omit<IRound, 'videos'> & {
  videos: Set<IGameVideo>;
  active: boolean;
}

export interface IGame {
  playersCount: number;
  rounds: IRound[];
}

export interface IReadyGame {
  rounds: IGameRound[];
}

export interface IFieldCell {
  videoId: string;
  name: string;
}

export interface IPlayer {
  fields: IFieldCell[][];
  lines: Set<number>[];
}

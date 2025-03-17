import { environment } from "../../environments/environment";
import { IBackgroundMusic, IGameResults, Winner } from "../models/models";

export const DEFAULT_BACKGROUND_MUSIC: IBackgroundMusic = {
  youtubeId: 'PJxxfilLnGI',
  start: 930,
};

export function getDefaultResults(roundsCount: number): IGameResults {
  return {
    lastStart: null,
    gameWinners: [],
    playingTicketsNumbers: [],
    rounds: Array.from({ length: roundsCount }, () => ({ playedSongs: [], wantedWinner: Winner.Line })),
    currentRoundIndex: 0,
    stepWinners:[],
  }
}

export const BASE_DEEP = 0;

export const WIN_NAMING = {
  [Winner.Line]: 'Линию',
  [Winner.Cross]: 'Крест',
  [Winner.All]: 'Все песни',
}

export const TEST_PERIOD = 15;

export const DELAY_BEFORE_PLAYING = environment.playerDelay * 1000;

export const RANDOMIZER_DURATION_STEP = 250;

import { IBackgroundMusic, IGameResults, Winner } from "../models/models";

export const DEFAULT_BACKGROUND_MUSIC: IBackgroundMusic = {
  youtubeId: 'PJxxfilLnGI',
  start: 930,
};

export function getDefaultResults(roundsCount: number): IGameResults {
  return {
    lastStart: null,
    wantedWinner: Winner.Line,
    gameWinners: [],
    wastedTickets: [],
    rounds: new Array(roundsCount).fill({playedSongs: []}),
    currentRoundIndex: 0,
    currentStep: 0,
  }
}

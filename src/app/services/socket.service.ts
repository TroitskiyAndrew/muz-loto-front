import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Callbacks, GameMessagePayload, GameMessageType, IStepResults, IStepResultsMessagePayload, ISubmitWinnersResults, PlayerMessagePayload, PlayerMessageType, SocketCallback, SocketMessage, SocketMessageType, TicketsMessagePayload, Winner } from '../models/models';
import { environment } from '../../environments/environment';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private callbacks: Callbacks = {} as Callbacks;
  private socketId =  Math.floor(Math.random() * 10001);

  constructor(private stateService: StateService) {
    this.socket = io(environment.backendUrl);
    this.socket.on('messageToClient', (data: SocketMessage<any>) => {
      if(this.stateService.gameCode === data.gameCode &&  this.callbacks[data.type]){
        this.callbacks[data.type](data);
      }
    });
  }

  sendMessage<T>(message: Omit<SocketMessage<T>, 'gameCode' | 'socketId'>) {
    this.socket.emit('messageToBack', {...message, gameCode: this.stateService.gameCode, socketId: this.socket.id!});
  }

  onMessage<T>(type: SocketMessageType, callback: SocketCallback<T>) {
    this.callbacks[type] = (data:SocketMessage<T>) => {
      if(data.gameCode === this.stateService.gameCode){
        if(data.type === SocketMessageType.Game && data.socketId === this.socket.id){
          return;
        }
        return callback(data)
      }
    };
  }

  unsubscribe(type: SocketMessageType){
    delete this.callbacks[type];
  }

  disconnect() {
    this.socket.disconnect();
  }

  // nextSong() {
  //   this.sendMessage({ type: SocketMessageType.Player, data: true });
  // }

  // stopSong() {
  //   this.sendMessage({ type: SocketMessageType.Player,  data: false });
  // }

  returnSong() {
    this.sendMessage({ type: SocketMessageType.Player,  data: null });
  }

  modalAnswer(answer: boolean) {
    this.sendMessage({ type: SocketMessageType.Modal,  data: answer });
  }

  startGame() {
    this.sendMessage({ type: SocketMessageType.Game,  data: true });
  }

  addTickets(tickets: number[]) {
    this.sendMessage<TicketsMessagePayload>({ type: SocketMessageType.Tickets,  data: { exclude: false, tickets } });
  }

  excludeTickets(tickets: number[]) {
    this.sendMessage<TicketsMessagePayload>({ type: SocketMessageType.Tickets,  data: { exclude: true, tickets } });
  }




  askPlayingTicketsCount(){
    this.sendMessage<GameMessagePayload>({ type: SocketMessageType.Game,  data: { type: GameMessageType.AskPlayingTicketsCount } });
  }

  answerPlayingTickets(count: number){
    this.sendMessage<GameMessagePayload>({ type: SocketMessageType.Game,  data: { type: GameMessageType.AnswerPlayingTicketsCount, count } });
  }

  askWinners(){
    this.sendMessage<GameMessagePayload>({ type: SocketMessageType.Game,  data: { type: GameMessageType.AskWinners } });
  }

  answerWinners(){
    this.sendMessage<GameMessagePayload>({ type: SocketMessageType.Game,  data: { type: GameMessageType.AnswerWinners } });
  }

  startRound(roundIndex: number){
    this.sendMessage<GameMessagePayload>({ type: SocketMessageType.Game,  data: { type: GameMessageType.StartRound, roundIndex } });
  }

  stopRound(next: boolean){
    this.sendMessage<GameMessagePayload>({ type: SocketMessageType.Game,  data: { type: GameMessageType.StopRound, next } });
  }


  playSong(songId: string, randomizedSongsIds: string[]){
    this.sendMessage<PlayerMessagePayload>({ type: SocketMessageType.Player,  data: { type: PlayerMessageType.PlaySong, songId, randomizedSongsIds } });
  }

  stopSong(){
    this.sendMessage<PlayerMessagePayload>({ type: SocketMessageType.Player,  data: { type: PlayerMessageType.StopSong } });
  }

  startStep(results: IStepResults) {
    const {stepWinners, selectedSongId, newLastStart} = results
    this.sendMessage<IStepResultsMessagePayload>({ type: SocketMessageType.Game,  data: { type: GameMessageType.StartStep, stepWinners, selectedSongId, newLastStart } });
  }

  submitWin( results: ISubmitWinnersResults){
    const {newWinners, wantedWinner} = results;
    this.sendMessage<GameMessagePayload>({ type: SocketMessageType.Game,  data: { type: GameMessageType.SubmitWinners, newWinners, wantedWinner } });
  }

  finishStep() {
    this.sendMessage<GameMessagePayload>({ type: SocketMessageType.Game,  data: { type: GameMessageType.FinishStep } });
  }

  changePlayingTickets(newPlayingTickets: number[]) {
    this.sendMessage<GameMessagePayload>({ type: SocketMessageType.Game,  data: { type: GameMessageType.ChangeTickets, newPlayingTickets } });
  }

  blockStopStep(block: boolean) {
    this.sendMessage<GameMessagePayload>({ type: SocketMessageType.Game,  data: { type: GameMessageType.BlockStopStep, block } });
  }





}

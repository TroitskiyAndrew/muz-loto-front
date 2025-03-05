import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Callbacks, SocketCallback, SocketMessage, SocketMessageType, TicketsMessagePayload } from '../models/models';
import { environment } from '../../environments/environment';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private callbacks: Callbacks = {} as Callbacks;

  constructor(private stateService: StateService) {
    // this.socket = io(environment.backendUrl);
    // this.socket.on('messageToClient', (data: SocketMessage<any>) => {
    //   if(this.stateService.gameCode === data.gameCode &&  this.callbacks[data.type]){
    //     this.callbacks[data.type](data);
    //   }
    // });
  }

  sendMessage<T>(message: SocketMessage<T>) {
    this.socket.emit('messageToBack', message);
  }

  onMessage<T>(type: SocketMessageType, callback: SocketCallback<T>) {
    this.callbacks[type] = callback;
  }

  disconnect() {
    this.socket.disconnect();
  }

  nextSong() {
    this.sendMessage({ type: SocketMessageType.Player, gameCode: this.stateService.gameCode, data: true });
  }

  stopSong() {
    this.sendMessage({ type: SocketMessageType.Player, gameCode: this.stateService.gameCode, data: false });
  }

  returnSong() {
    this.sendMessage({ type: SocketMessageType.Player, gameCode: this.stateService.gameCode, data: null });
  }

  modalAnswer(answer: boolean) {
    this.sendMessage({ type: SocketMessageType.Modal, gameCode: this.stateService.gameCode, data: answer });
  }

  startGame() {
    this.sendMessage({ type: SocketMessageType.Game, gameCode: this.stateService.gameCode, data: true });
  }

  addTickets(tickets: number[]) {
    this.sendMessage<TicketsMessagePayload>({ type: SocketMessageType.Tickets, gameCode: this.stateService.gameCode, data: { add: true, tickets } });
  }

  excludeTickets(tickets: number[]) {
    this.sendMessage<TicketsMessagePayload>({ type: SocketMessageType.Tickets, gameCode: this.stateService.gameCode, data: { add: true, tickets } });
  }

}

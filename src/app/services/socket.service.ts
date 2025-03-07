import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Callbacks, SocketCallback, SocketMessage, SocketMessageType, TicketsMessagePayload } from '../models/models';
import { environment } from '../../environments/environment';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private callbacks: Callbacks = {} as Callbacks;

  constructor(private stateService: StateService) {
    this.socket = io(environment.backendUrl);
    this.socket.on('messageToClient', (data: SocketMessage<any>) => {
      if(this.stateService.gameCode === data.gameCode &&  this.callbacks[data.type]){
        this.callbacks[data.type](data);
      }
    });
  }

  sendMessage<T>(message: Omit<SocketMessage<T>, 'gameCode'>) {
    this.socket.emit('messageToBack', {...message, gameCode: this.stateService.gameCode});
  }

  onMessage<T>(type: SocketMessageType, callback: SocketCallback<T>) {
    this.callbacks[type] = callback;
    this.callbacks[type] = (data:SocketMessage<T>) => {
      if(data.gameCode === this.stateService.gameCode){
        return callback(data)
      }
    };
  }

  disconnect() {
    this.socket.disconnect();
  }

  nextSong() {
    this.sendMessage({ type: SocketMessageType.Player, data: true });
  }

  stopSong() {
    this.sendMessage({ type: SocketMessageType.Player,  data: false });
  }

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
    this.sendMessage<TicketsMessagePayload>({ type: SocketMessageType.Tickets,  data: { add: true, tickets } });
  }

  excludeTickets(tickets: number[]) {
    this.sendMessage<TicketsMessagePayload>({ type: SocketMessageType.Tickets,  data: { add: false, tickets } });
  }

}

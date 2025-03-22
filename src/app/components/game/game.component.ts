import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import {
  IGameSettings,
  IGame,
  IRoundTicket,
  IRound,
  IRoundSong,
  ITicket,
  SocketMessageType,
  TicketsMessagePayload,
  Weight,
  Winner,
  INewGame,
  ISongPreferences,
  IDisplaySong,
  ISongWithParams,
} from '../../models/models';
import { PlayerService } from '../../services/player.service';
import { environment } from '../../../environments/environment';
import { StateService } from '../../services/state.service';
import { CreatorService } from '../../services/creator.service';
import { getRandomElem } from '../../utils/utils';
import { ModalService } from '../../services/modal.service';
import { SocketService } from '../../services/socket.service';
import { DialogService } from '../../services/dialog.service';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { LoadingService } from '../../services/loading.service';
import { ApiService } from '../../services/api.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent {
  @Input() game!: INewGame;
  displayedColumns: string[] = ['song', 'play', 'change'];
  @Input() songs: ISongWithParams[] = [];
  wastedSongs = new Set<string>()

  constructor(private playerService: PlayerService) {}

  getDataSource(round: IRound){
    return new MatTableDataSource<IRoundSong>(round.field.flat());
  }

  playSong(song: IRoundSong){
    this.playerService.play(song);
  }

  changeSong(round: IRound, index: number){
    const cols = round.field[0].length;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const usedSongs = new Set(this.game.rounds.map(round => round.field.flat()).flat().map(song => song.id));
    const usedArtists = new Set(round.field.flat().map(song => song.artist))
    const oldSong = round.field[row][col];
    this.wastedSongs.add(oldSong.id);
    const allAvailableSongs = this.songs.filter(song => {
      return !song.disabled && !usedSongs.has(song.id) && (!usedArtists.has(song.artist) || song.artist === oldSong.artist) && !this.wastedSongs.has(song.id)
    });
    if(allAvailableSongs.length === 0){
      this.wastedSongs.clear();
      this.changeSong(round, index);
      return;
    }
    const randomSong = [...allAvailableSongs.filter(song => song.priority).sort(() => Math.random() - 0.5), ...allAvailableSongs.filter(song => !song.priority).sort(() => Math.random() - 0.5)][0];
    return round.field[row][col] = {...randomSong, number: oldSong.number, played: false, class: ''};
  }

}

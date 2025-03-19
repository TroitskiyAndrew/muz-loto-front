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

interface SongRow {
  round1Artist: string;
  round1Name: string;
  round2Artist: string;
  round2Name: string;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent {
  @Input() game!: INewGame;
  dataSource = new MatTableDataSource<SongRow>([]);
  displayedColumns: string[] = ['artist', 'name'];

  constructor(private playerService: PlayerService) {}

  getDataSource(round: IRound){
    return new MatTableDataSource<IRoundSong>(round.field.flat());
  }

  playSong(song: IRoundSong){
    this.playerService.play(song);
  }

}

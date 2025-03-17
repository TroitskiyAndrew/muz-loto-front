import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '../../services/dialog.service';
import { FormControl, Validators } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { LoadingService } from '../../services/loading.service';
import { PlayerService } from '../../services/player.service';
import {
  DELAY_BEFORE_PLAYING,
  RANDOMIZER_DURATION_STEP,
  TEST_PERIOD,
} from '../../constants/constants';
import {
  IGame,
  PlayerMessagePayload,
  PlayerMessageType,
  SocketMessageType,
} from '../../models/models';
import { StateService } from '../../services/state.service';
import { Subscription } from 'rxjs';

let i = 1;

@Component({
  selector: 'app-game-page',
  templateUrl: './game-page.component.html',
  styleUrl: './game-page.component.scss',
})
export class GamePageComponent implements OnDestroy {
  sub$!: Subscription;

  constructor(
    private socketService: SocketService,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private router: Router,
    public gameService: GameService,
    private loadingService: LoadingService,
    private playerService: PlayerService,
    private stateService: StateService
  ) {
    this.stateService.showContacts = false;
    this.init();
  }

  rightClick(event: Event) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }

  async init() {
    let game: IGame | null;
    let code = this.route.snapshot.params['code'];
    if (code) {
      this.loadingService.show();
      game = await this.gameService.init({ code, isFront: true });
      if (!game) {
        this.loadingService.hide();
        this.router.navigate(['']);
        return;
      }

      this.playerService.playBackGround(game.backgroundMusic);
      this.loadingService.hide();
    } else {
      const codeField = {
        id: 'code',
        label: '',
        control: new FormControl('', [Validators.required]),
      };
      code = await this.dialogService.init({
        disableClose: true,
        message: 'Введите код игры',
        fields: [codeField],
        buttons: [
          {
            label: 'Ок',
            disabled: () => codeField.control.invalid,
            action: () => codeField.control.value as string,
          },
          {
            label: 'Выход',
            disabled: () => false,
            action: () => null,
            class: 'cancel',
          },
        ],
      });
      this.router.navigate(code != null ? ['game/', code] : ['']);
      return;
    }
    const cub = this.playerService.$initBackGround.subscribe((val) => {
      if(val) {
        this.playerService.playBackGround(game.backgroundMusic);
        setTimeout(() => cub.unsubscribe())
      }
    })
    this.stateService.gameCode = game.code;
    this.playerService.gameMode = true;
    if (game.testGame) {
      this.dialogService.popUp({
        message: `Это тестовая игра. Вы сможете сделать ${TEST_PERIOD} ходов`,
      });
    }
    this.socketService.onMessage<PlayerMessagePayload>(
      SocketMessageType.Player,
      ({ data }) => {
        switch (data.type) {
          case PlayerMessageType.PlaySong:
            this.playSong(data.songId, data.randomizedSongsIds);
            break;
          case PlayerMessageType.StopSong:
            this.stopSong();
            break;
        }
      }
    );
  }



  get game() {
    return this.gameService.game;
  }

  handleClick(event: Event) {
    event?.stopImmediatePropagation();
    this.gameService.makeStep();
  }

  playSong(songId: string, randomizedSongsIds: string[]) {
    const selectedSong = this.gameService.roundSongsMap.get(songId)!;
    let i = 0;
    const randomizerInterval = setInterval(() => {
      if (i > 0) {
        this.gameService.roundSongsMap.get(randomizedSongsIds[i - 1])!.class =
          '';
      }
      this.gameService.roundSongsMap.get(randomizedSongsIds[i])!.class =
        'picked';
      i++;
    }, RANDOMIZER_DURATION_STEP);
    setTimeout(() => {
      clearInterval(randomizerInterval);
      this.gameService.roundSongsMap.get(randomizedSongsIds[i - 1])!.class = '';
      selectedSong.class = 'selected';
    }, DELAY_BEFORE_PLAYING - 500);

    this.playerService.play(selectedSong).then((fromPlayer) => {
      if (fromPlayer) {
        this.gameService.sendFinishStepMessage(true);
      }
    });
  }

  private stopSong() {
    this.playerService.stop(false);
  }

  startRound() {
    this.gameService.sendStartRoundMessage();
  }

  ngOnDestroy(): void {
    this.playerService.gameMode = false;
    this.gameService.playingMode = false;
    this.playerService.stopBackGround();
    this.socketService.unsubscribe(SocketMessageType.Player);
    this.stateService.gameCode = '';
    this.stateService.showContacts = true;
  }
}

import { Component, OnDestroy, ViewChild } from '@angular/core';
import { CreatorService } from '../../services/creator.service';
import { SongsService } from '../../services/songs.service';
import { IGame, IRoundSettings, ISong, ISongWithParams } from '../../models/models';
import { LoadingService } from '../../services/loading.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PlayerService } from '../../services/player.service';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { Router } from '@angular/router';
import { DialogService } from '../../services/dialog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-game-page',
  templateUrl: './create-game-page.component.html',
  styleUrl: './create-game-page.component.scss',
})
export class CreateGamePageComponent implements OnDestroy {
  songs: ISongWithParams[] = [];
  displayedColumns: string[] = [
    'artist',
    'name',
    'rus',
    'priority',
    'disabled',
    'round',
    'play',
  ];
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<ISongWithParams>([]);
  artistFilter = '';
  nameFilter = '';
  form: FormGroup;
  sub: Subscription

  constructor(
    private creatorService: CreatorService,
    private songsService: SongsService,
    private loadingService: LoadingService,
    private playerService: PlayerService,
    private fb: FormBuilder,
    private apiService: ApiService,
    private stateService: StateService,
    private router: Router,
    private dialogService: DialogService,
  ) {
    this.loadingService.show();
    this.sub = this.stateService.$init.subscribe((init: boolean) => {
      if(!init){
        this.loadingService.hide()
        return;
      }
      this.init().finally(() => this.loadingService.hide());
    })
    this.form = this.fb.group({
      ticketsCount: [
        42,
        [Validators.required, Validators.min(12), Validators.max(60)],
      ],
      backgroundMusic: this.fb.group({
        youtubeId: ['PJxxfilLnGI', Validators.required],
        start: [930, Validators.required],
      }),
      rounds: this.fb.array([
        this.fb.group({
          roundFieldColumns: [
            { value: 7, disabled: true },
            Validators.required,
          ],
          roundFieldRows: [{ value: 6, disabled: true }, Validators.required],
          ticketFieldColumns: [
            { value: 5, disabled: true },
            Validators.required,
          ],
          ticketFieldRows: [{ value: 5, disabled: true }, Validators.required],
          lineWinners: [
            1,
            [Validators.required, Validators.min(1), Validators.max(2)],
          ],
          crossWinners: [
            1,
            [Validators.required, Validators.min(1), Validators.max(2)],
          ],
          allWinners: [
            { value: 1, disabled: true },
            [Validators.required, Validators.min(1), Validators.max(2)],
          ],
          notRusSongs: [
            5,
            [Validators.required, Validators.min(0), Validators.max(7)],
          ],
        }),
        this.fb.group({
          roundFieldColumns: [
            { value: 7, disabled: true },
            Validators.required,
          ],
          roundFieldRows: [{ value: 6, disabled: true }, Validators.required],
          ticketFieldColumns: [
            { value: 5, disabled: true },
            Validators.required,
          ],
          ticketFieldRows: [{ value: 5, disabled: true }, Validators.required],
          lineWinners: [
            1,
            [Validators.required, Validators.min(1), Validators.max(2)],
          ],
          crossWinners: [
            1,
            [Validators.required, Validators.min(1), Validators.max(2)],
          ],
          allWinners: [
            { value: 1, disabled: true },
            [Validators.required, Validators.min(1), Validators.max(2)],
          ],
          notRusSongs: [
            5,
            [Validators.required, Validators.min(0), Validators.max(7)],
          ],
        }),
      ]),
    });
  }

  async init() {

    this.songs = (await this.songsService.getSongs()) || [];
    this.dataSource = new MatTableDataSource<ISongWithParams>(
      this.songs
    );
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (
      data: ISongWithParams,
      filter: string
    ) => {
      console.log('filterPredicate');
      const [artist, name] = filter.split("='.'=");
      const nameCondition = name
        ? data.name.toLowerCase().includes(name.toLowerCase())
        : true;
      const artistCondition = artist
        ? data.artist.toLowerCase().includes(artist.toLowerCase())
        : true;
      return artistCondition && nameCondition;
    };
  }

  eventHandler(event: Event) {
    event.stopImmediatePropagation();
  }

  filterByArtist(event: Event) {
    const target = event.target as HTMLInputElement;
    this.artistFilter = target.value;
    this.filter();
  }

  filterByName(event: Event) {
    const target = event.target as HTMLInputElement;
    this.nameFilter = target.value;
    this.filter();
  }

  private filter() {
    this.dataSource.filter = [this.artistFilter, this.nameFilter]
      .join("='.'=")
      .trim()
      .toLowerCase();
  }

  playSong(song: ISongWithParams) {
    this.playerService.play(song);
  }

  get rounds(): FormArray<FormGroup> {
    return this.form.get('rounds') as FormArray;
  }

  async createGame(testGame = false) {
    if(!this.stateService.user?.gamesCredit && !testGame){
      this.dialogService.popUp({errorMessage: 'У вас закончились купленные игры :-('}, 'Понятно');
      return;
    }
    const settings = {...this.form.getRawValue(), testGame }
    this.loadingService.show();
    await this.creatorService.generateGame(
      this.songs,
      settings
    ).then(game => this.creatorService.generateTickets(
      game,
      settings.rounds,
      settings.ticketsCount
    )).finally(() => this.loadingService.hide());
    this.router.navigate(['/'])
  }

  playBackground() {
    this.playerService.play(this.form.value.backgroundMusic);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}

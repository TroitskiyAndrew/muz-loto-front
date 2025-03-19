import { Component, OnDestroy, ViewChild } from '@angular/core';
import { CreatorService } from '../../services/creator.service';
import { SongsService } from '../../services/songs.service';
import {
  IDisplaySong,
  IGame,
  INewGame,
  IRoundSettings,
  ISong,
  ISongHistory,
  ISongWithParams,
  IUsedSongs,
} from '../../models/models';
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
  songs: IDisplaySong[] = [];
  displayedColumns: string[] = [
    'pending',
    'artist',
    'name',
    'rus',
    'usageCount',
    'lastUsage',
    'priority',
    'disabled',
    'round',
    'play',
  ];
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<IDisplaySong>([]);
  artistFilter = '';
  nameFilter = '';
  usageFilter = '';
  form: FormGroup;
  songForm: FormGroup;
  isBackGroundPlaying = false;

  scratchGame: INewGame | null = null;
  usedSongsArr: IUsedSongs[] = [];

  constructor(
    private creatorService: CreatorService,
    private songsService: SongsService,
    private loadingService: LoadingService,
    private playerService: PlayerService,
    private fb: FormBuilder,
    private apiService: ApiService,
    public stateService: StateService,
    private router: Router,
    private dialogService: DialogService
  ) {
    this.loadingService.show();
    this.stateService.showContacts = false;
    const sub$ =  this.stateService.$init.subscribe((init: boolean) => {
      if (!init) {
        this.loadingService.hide();
        return;
      }
      setTimeout(() => sub$.unsubscribe())
      this.init().finally(() => this.loadingService.hide());
    });
    this.form = this.fb.group({
      ticketsCount: [
        42,
        [Validators.required, Validators.min(12), Validators.max(60)],
      ],
      backgroundMusic: this.fb.group({
        youtubeId: ['PJxxfilLnGI', Validators.required],
        start: [930, Validators.required],
      }),
      comment: [''],
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
            [Validators.required, Validators.min(0), Validators.max(2)],
          ],
          crossWinners: [
            1,
            [Validators.required, Validators.min(0), Validators.max(2)],
          ],
          allWinners: [
            1,
            [Validators.required, Validators.min(0), Validators.max(1)],
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
            [Validators.required, Validators.min(0), Validators.max(2)],
          ],
          crossWinners: [
            1,
            [Validators.required, Validators.min(0), Validators.max(2)],
          ],
          allWinners: [
            1,
            [Validators.required, Validators.min(0), Validators.max(1)],
          ],
          notRusSongs: [
            5,
            [Validators.required, Validators.min(0), Validators.max(7)],
          ],
        }),
      ]),
    });
    this.songForm = this.fb.group({
      youtubeId: ['', [Validators.required]],
      start: [0, [Validators.required, Validators.min(0)]],
      artist: ['', [Validators.required]],
      name: ['', [Validators.required]],
      rus: [true, [Validators.required]],
    });
  }

  async init() {
    this.loadingService.show()
    this.songs = ((await this.songsService.getSongs()) || []).map(this.mapSong);
    this.loadingService.hide()
    this.dataSource = new MatTableDataSource<IDisplaySong>(this.songs);
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data: IDisplaySong, filter: string) => {
      console.log('filterPredicate');
      const [artist, name, usageFilter] = filter.split("='.'=");
      const nameCondition = name
        ? data.name.toLowerCase().includes(name.toLowerCase())
        : true;
      const artistCondition = artist
        ? data.artist.toLowerCase().includes(artist.toLowerCase())
        : true;
      const usageCondition = usageFilter
        ? data.lastUsage.toLowerCase().includes(usageFilter.toLowerCase())
        : true;
      return artistCondition && nameCondition && usageCondition;
    };
  }

  mapSong(song: ISongWithParams): IDisplaySong {
    const { history, ...rest } = song;
    const lastUsage = history[history.length - 1];
    return {
      ...rest,
      lastUsage: lastUsage
        ? `${lastUsage.code}/${lastUsage.round} ${
            lastUsage.lastStart.split(' ')[0]
          }`
        : '',
      usageCount: history.length,
      pending: Boolean(song.owner)
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

  filterByUsage(event: Event) {
    const target = event.target as HTMLInputElement;
    this.usageFilter = target.value;
    this.filter();
  }

  private filter() {
    this.dataSource.filter = [
      this.artistFilter,
      this.nameFilter,
      this.usageFilter,
    ]
      .join("='.'=")
      .trim()
      .toLowerCase();
  }

  playSong(song: ISongWithParams) {
    this.playerService.play(song);
  }

  playNewSong() {
    this.playerService.play(this.songForm.value);
  }

  async createSong() {
    const song = this.songForm.getRawValue();
    if(this.songs.map(existedSong => existedSong.youtubeId).includes(song.youtubeId)){
      await this.dialogService.popUp({errorMessage: 'Эта песня уже есть'}, 'Понял');
      return;
    }
    this.loadingService.show();
    const newSong = await this.apiService.createSong({ ...song, games: [] }).finally(() => this.loadingService.hide());
    if (newSong) {
      this.dataSource.data = [...this.dataSource.data, this.mapSong({...newSong, history: []})];
    }
  }

  async acceptSong(song: IDisplaySong){
    this.loadingService.show()
    const updatedSong = await this.apiService.updateSong({id: song.id, owner: ''}).finally(() => this.loadingService.hide());
    if(updatedSong){
      song.pending = false;
    }
  }

  get rounds(): FormArray<FormGroup> {
    return this.form.get('rounds') as FormArray;
  }

  getCodes(history: ISongHistory[]) {
    return history.map((h) => h.code).join(', ');
  }

  async createGame(testGame = false) {
    if (!this.stateService.user?.gamesCredit && !testGame) {
      this.dialogService.popUp(
        { errorMessage: 'У вас закончились купленные игры :-(' },
        'Понятно'
      );
      return;
    }
    const settings = { ...this.form.getRawValue(), testGame };
    this.loadingService.show();
    await this.creatorService
      .createGame({game: this.scratchGame!, usedSongsArr: this.usedSongsArr, songsPreferences: this.songs})
      .then((game) =>
        this.creatorService.generateTickets(
          game,
          settings.rounds,
          settings.ticketsCount
        )
      )
      .finally(() => this.loadingService.hide());
    this.router.navigate(['/']);
  }
  async generateGame(testGame = false) {
    const settings = { ...this.form.getRawValue(), testGame };
    const {game, usedSongsArr} = this.creatorService
      .generateGame(
        this.songs.map((song) => ({ ...song, history: [] })),
        settings
      );

    this.scratchGame = game;
    this.usedSongsArr = usedSongsArr;
  }

  playBackground() {
    this.playerService.playBackGround(this.form.value.backgroundMusic);
    this.isBackGroundPlaying = true;
  }
  stopBackground() {
    this.playerService.stopBackGround();
    this.isBackGroundPlaying = false;
  }

  changePriority(song: IDisplaySong){
    if(song.priority){
      song.disabled = false;
      song.round = undefined
    }
  }
  changeDisabled(song: IDisplaySong){
    if(song.disabled){
      song.priority = false;
      song.round = undefined
    }
  }
  changeRound(song: IDisplaySong){
    if(song.round){
      song.disabled = false;
      song.priority = false;
    }
  }

  dropSongRound(song: IDisplaySong){
    song.round = undefined;
  }

  ngOnDestroy(): void {
    this.stateService.showContacts = true;
  }
}

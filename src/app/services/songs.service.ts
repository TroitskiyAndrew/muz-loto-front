import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { LoadingService } from './loading.service';
import { INewSong, ISong } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SongsService {

  constructor(private apiService: ApiService) { }

  getSongs(){
    return this.apiService.getSongs()
  }

  saveSongs(songs: INewSong[]){
    return this.apiService.createSong(songs)
  }

}

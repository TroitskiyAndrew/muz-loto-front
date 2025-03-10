import { Component, OnDestroy } from '@angular/core';
import { StateService } from '../../services/state.service';
import { ApiService } from '../../services/api.service';
import { DialogService } from '../../services/dialog.service';
import { FormControl, Validators } from '@angular/forms';
import { IAuthResponse } from '../../models/models';
import { DEFAULT_BACKGROUND_MUSIC } from '../../constants/constants';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnDestroy{

  constructor(public authService: AuthService, public stateService: StateService, private router: Router) {
    this.stateService.showHome = false;
  }

  login() {
    this.authService.login();
  }

  signUp() {
    this.authService.signUp();
  }

  logout(){
    this.authService.logout();
  }

  runGame(){
    this.router.navigate(['game']);
  }

  createGame(){
    this.router.navigate(['createGame']);
  }

  myGames(){
    this.router.navigate(['myGames']);
  }

  ngOnDestroy(): void {
    this.stateService.showHome = true;
  }

}

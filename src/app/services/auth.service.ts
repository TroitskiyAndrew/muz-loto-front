import { Injectable } from '@angular/core';
import { IAuthResponse } from '../models/models';
import { DEFAULT_BACKGROUND_MUSIC } from '../constants/constants';
import { FormControl, Validators } from '@angular/forms';
import { StateService } from './state.service';
import { ApiService } from './api.service';
import { DialogService } from './dialog.service';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

   constructor(public stateService: StateService, private apiService: ApiService, private dialogService: DialogService, private loadingService: LoadingService) { }

    login() {

      const emailField = { id: 'email', label: 'email', control: new FormControl('', [Validators.required]) };
      const passwordField = { id: 'password', type: 'password', label: 'password', control: new FormControl('', [Validators.required]) };
      return this.dialogService.init({
        message: 'Войти',
        fields: [emailField, passwordField],
        buttons: [{
          label: 'Войти',
          disabled: () => emailField.control.invalid || passwordField.control.invalid,
          action: async () => {
            this.loadingService.show();
            const email = emailField.control.value as string;
            const password = passwordField.control.value as string;
            const hashedPassword = await this.hashPassword(password);
            return await this.apiService.auth({email, hashedPassword}).then(this.handleAuthResponse.bind(this)).finally(() => this.loadingService.hide());
          },
        },
        {
          label: 'Отмена',
          disabled: () => false,
          action: () => null,
          class: 'cancel'
        }
        ]
      });
    }

    signUp() {

      const emailField = { id: 'email', label: 'email', control: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]) };
      const passwordField = { id: 'password', type: 'password', label: 'password', control: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+$/)]) };
      return this.dialogService.init({
        fields: [emailField, passwordField],
        buttons: [{
          label: 'Зарегистрироваться',
          disabled: () => emailField.control.invalid || passwordField.control.invalid,
          action: async () => {
            const email = emailField.control.value as string;
            const password = passwordField.control.value as string;
            this.loadingService.show();
            const hashedPassword = await this.hashPassword(password);
            const logo = 'global';
            const backgroundMusic = DEFAULT_BACKGROUND_MUSIC;
            return await this.apiService.createUser({email, hashedPassword, logo, backgroundMusic}).then(this.handleAuthResponse.bind(this)).finally(() => this.loadingService.hide());
          },
        },
        {
          label: 'Отмена',
          disabled: () => false,
          action: () => null,
          class: 'cancel'
        }
        ]
      });
    }

    private async hashPassword(password: string) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    private handleAuthResponse (res: IAuthResponse | null) {
      if(!res){
        return;
      }
      this.stateService.setUser(res.user);
      localStorage.setItem('token', res.token);
    }

    logout(){
      localStorage.removeItem('token');
      this.stateService.user = null;
    }

    restoreUser(){
      this.loadingService.show();
      return this.apiService.getUser().then(user => {
        if(user){
          this.stateService.setUser(user);
        }
        this.loadingService.hide();
      })
    }
}

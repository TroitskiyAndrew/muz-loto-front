import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlayerComponent } from './components/player/player.component';
import { FieldComponent } from './components/field/field.component';
import { ModalComponent } from './components/modal/modal.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogComponent } from './components/dialog/dialog.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { LoadingOverlayComponent } from './components/loading-overlay/loading-overlay.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { CreateGamePageComponent } from './pages/create-game-page/create-game-page.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GamesPageComponent } from './pages/games-page/games-page.component';
import { RunPageComponent } from './pages/run-page/run-page.component';
import { GamePageComponent } from './pages/game-page/game-page.component';

@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent,
    FieldComponent,
    GamePageComponent,
    ModalComponent,
    DialogComponent,
    HomePageComponent,
    LoadingOverlayComponent,
    CreateGamePageComponent,
    GamesPageComponent,
    RunPageComponent,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideAnimationsAsync()
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatDialogModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTableModule,
    RouterModule,
    AppRoutingModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

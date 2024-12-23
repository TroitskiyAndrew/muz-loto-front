import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlayerComponent } from './components/player/player.component';
import { FieldComponent } from './components/field/field.component';
import { GameComponent } from './components/game/game.component';
@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent,
    FieldComponent,
    GameComponent
  ],
  providers: [],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { CreateGamePageComponent } from './pages/create-game-page/create-game-page.component';
import { GamesPageComponent } from './pages/games-page/games-page.component';
import { RunPageComponent } from './pages/run-page/run-page.component';
import { GamePageComponent } from './pages/game-page/game-page.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomePageComponent
  },
  {
    path: 'game',
    component: GamePageComponent
  },
  {
    path: 'game/:code',
    component: GamePageComponent
  },
  {
    path: 'runGame/:code',
    component: RunPageComponent
  },
  {
    path: 'createGame',
    component: CreateGamePageComponent
  },
  {
    path: 'myGames',
    component: GamesPageComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

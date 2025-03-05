import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { GameComponent } from './components/game/game.component';
import { CreateGamePageComponent } from './pages/create-game-page/create-game-page.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomePageComponent
  },
  {
    path: 'game',
    component: GameComponent
  },
  {
    path: 'game/:gameId',
    component: GameComponent
  },
  {
    path: 'createGame',
    component: CreateGamePageComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

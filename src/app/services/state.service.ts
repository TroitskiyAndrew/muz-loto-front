import { Injectable } from '@angular/core';
import { IGame, IGameRound, IGameVideo, IPlayer, IFieldCell, IReadyGame, IRound } from '../models/models';
import { environment } from '../../environments/environment';
import { extractTimestamp, extractVideoId } from '../utils/utils';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  game: IReadyGame = {
    rounds: [],
  };

  constructor() { }

  initGame(){
    this.game = {
      rounds: game.rounds.map(round => {
        const videos = [...round.videos].sort(() => Math.random() - 0.5);
        let videosForFields = [...videos];
        let fields: IFieldCell[][] = [];
        if (round.fields.length){
          fields = round.fields;
        } else {
          for (let i = 0; i < round.roundFieldRows; i++){
            const cells: IFieldCell[] = [];
            for (let i2 = 0; i2 < round.roundFieldColumns; i2++){
              const video = videosForFields[Math.floor(Math.random() * videosForFields.length)];
              videosForFields = videosForFields.filter(({url}) => url !== video.url)
              cells.push({
                videoId: extractVideoId(video.url)!,
                name: video.name
              })
            }
            fields.push(cells);
          }
        }
        const gameRound: IGameRound = {

          ...round,
          active: false,
          fields,
          players: round.players.length ? round.players : this.createCards(round, fields.flat()),
          videos: new Set(fields.flat().map((field, index) => {
            const videoObject = videos.find(video => extractVideoId(video.url) === field.videoId)!;
            return {
              name: videoObject.name,
              id: extractVideoId(videoObject.url)!,
              start: extractTimestamp(videoObject.url)!,
              duration: videoObject.duration,
              number: index + 1,
              played: false,
              selected: false,
            }
          }))
        }
        return gameRound;
      }),


    };
  }

  createCards(round: IRound, fields: IFieldCell[]): IPlayer[]{
    const players: IPlayer[] = [];
    for (let i = 1; i <= environment.cardsCount; i++){
      let unusedVideos = [...fields].sort(() => Math.random() - 0.5);
      const rows = [];
      for (let i2 = 0; i2 < round.playerFieldRows; i2++){
        const cells: IFieldCell[] = [];
        for (let i3 = 0; i3 < round.playerFieldColumns; i3++){
          const selectedVideo = unusedVideos[Math.floor(Math.random() * unusedVideos.length)];
          unusedVideos = unusedVideos.filter(video => video.videoId !== selectedVideo.videoId);
          console.log(unusedVideos.length)
          cells.push(selectedVideo);
        }
        rows.push(cells);
      }
      players.push({
        number: i,
        fields: rows,
        lines: []
      });

    }
    return players;
  }
}

const game: IGame = {
  playersCount: 50,
  rounds: [
    {
      name: 'Раунд №1',
      roundFieldColumns: 6,
      roundFieldRows: 6,
      playerFieldColumns: 5,
      playerFieldRows: 5,
      videos: [
        { url: 'https://youtu.be/J0xe5DcnYSA?t=45', name: "Green Day - Holiday", duration: 10 },
        { url: 'https://youtu.be/8DyziWtkfBw?t=23', name: "Red Hot Chili Peppers - Can't Stop", duration: 10 },
        { url: 'https://youtu.be/AwXKXl692KU?t=58', name: "Руки Вверх - Крошка моя", duration: 10 },
        { url: 'https://youtu.be/1EozE3URh-8?t=44', name: "Звери - Районы-кварталы", duration: 10 },
        { url: 'https://youtu.be/QIf27aH7e8c?t=77', name: "Жуки - Батарейка", duration: 10 },
        { url: 'https://youtu.be/rUd2diUWDyI?t=70', name: "ЛЕПРИКОНСЫ - Хали-гали, паратрупер", duration: 10 },
        { url: 'https://youtu.be/5GbSKaFf8Uc?t=97', name: "ПОРНОФИЛЬМЫ - Я так соскучился", duration: 10 },
        { url: 'https://youtu.be/A1hhCIfPtIc?t=58', name: "Zdob si Zdub - Видели ночь", duration: 10 },
        { url: 'https://youtu.be/vx2u5uUu3DE?t=58', name: "Bon Jovi - It's My Life", duration: 10 },
        { url: 'https://youtu.be/eVTXPUF4Oz4?t=54', name: "Linkin Park - In The End", duration: 10 },
        { url: 'https://youtu.be/-tJYN-eG1zk?t=29', name: "Queen - We Will Rock You", duration: 10 },
        { url: 'https://youtu.be/nj5nuYYrZvg?t=45', name: "Мумий Тролль - Владивосток 2000", duration: 10 },
        { url: 'https://youtu.be/VMS30oV8ApE?t=67', name: "Валентин Стрыкало - Наше лето", duration: 10 },
        { url: 'https://youtu.be/spDy95Sww6k?t=53', name: "Animal ДжаZ - Три полоски", duration: 10 },
        { url: 'https://youtu.be/SAUbHAwTJ-Y?t=64', name: "Валерий Меладзе - Самба белого мотылька", duration: 10 },
        { url: 'https://youtu.be/qN1JUvS2kqo?t=64', name: "Ирина Аллегрова - Угонщица", duration: 10 },
        { url: 'https://youtu.be/_-nvcdBzDWs?t=62', name: "Ирина Аллегрова - Младший лейтенант", duration: 10 },
        { url: 'https://youtu.be/mV5xJT7BnzE?t=58', name: "Ёлка - Прованс", duration: 10 },
        { url: 'https://youtu.be/Q8WJz-DmPVg?t=55', name: "МакSим - Знаешь ли ты", duration: 10 },
        { url: 'https://youtu.be/_djms7Knbos?t=78', name: "t.A.T.u. - Нас не догонят", duration: 10 },
        { url: 'https://youtu.be/tnZPDs9qepA?t=74', name: "Бумбокс - Вахтерам", duration: 10 },
        { url: 'https://youtu.be/8zHjanBzZt8?t=55', name: "Каста — Вокруг шум", duration: 10 },
        { url: 'https://youtu.be/G7KNmW9a75Y?t=33', name: "Miley Cyrus - Flowers", duration: 10 },
        { url: 'https://youtu.be/tAp9BKosZXs?t=33', name: "Katy Perry - I Kissed A Girl", duration: 10 },
        { url: 'https://youtu.be/rFvV5_UnSeM?t=142', name: "SEREBRO - МАМА ЛЮБА", duration: 10 },
        { url: 'https://youtu.be/t_la20ZBpCQ?t=71', name: "Руки Вверх! - 18 мне уже", duration: 10 },
        { url: 'https://youtu.be/lvCErYl62Zs?t=58', name: "Иванушки Int. - Тополиный пух", duration: 10 },
        { url: 'https://youtu.be/0fmOMnjHGuA?t=48', name: "ВИА Гра - Попытка №5", duration: 10 },
        { url: 'https://youtu.be/CTQxNgCejVg?t=67', name: "Звери - Дожди-пистолеты", duration: 10 },
        { url: 'https://youtu.be/EsX-0VBb0j0?t=47', name: "Макс Корж — Жить в кайф", duration: 10 },
        { url: 'https://youtu.be/fou72UMdG0k?t=59', name: "Градусы — Голая", duration: 10 },
        { url: 'https://youtu.be/yUp01GbQxTw?t=53', name: "Король и Шут - Кукла колдуна", duration: 10 },
        { url: 'https://youtu.be/0JMdXFHo5SY?t=62', name: "КАТЯ ЛЕЛЬ - Мой мармеладный", duration: 10 },
        { url: 'https://youtu.be/N_ML7DbTRFw?t=40', name: "Натали - О боже, какой мужчина!", duration: 10 },
        { url: 'https://youtu.be/lluIQebmAMM?t=71', name: "Руки Вверх - Он тебя целует", duration: 10 },
        { url: 'https://youtu.be/Bx8Fo7WRpXg?t=32', name: "Султан Лагучев - Горький вкус", duration: 10 },
      ],
      players: [],
      fields: [],
    },
    {
      name: 'Раунд №2',
      roundFieldColumns: 6,
      roundFieldRows: 6,
      playerFieldColumns: 5,
      playerFieldRows: 5,
      videos: [
        { url: 'https://youtu.be/J0xe5DcnYSA?t=45', name: "Green Day - Holiday", duration: 10 },
        { url: 'https://youtu.be/8DyziWtkfBw?t=23', name: "Red Hot Chili Peppers - Can't Stop", duration: 10 },
        { url: 'https://youtu.be/AwXKXl692KU?t=58', name: "Руки Вверх - Крошка моя", duration: 10 },
        { url: 'https://youtu.be/1EozE3URh-8?t=44', name: "Звери - Районы-кварталы", duration: 10 },
        { url: 'https://youtu.be/QIf27aH7e8c?t=77', name: "Жуки - Батарейка", duration: 10 },
        { url: 'https://youtu.be/rUd2diUWDyI?t=70', name: "ЛЕПРИКОНСЫ - Хали-гали, паратрупер", duration: 10 },
        { url: 'https://youtu.be/5GbSKaFf8Uc?t=97', name: "ПОРНОФИЛЬМЫ - Я так соскучился", duration: 10 },
        { url: 'https://youtu.be/A1hhCIfPtIc?t=58', name: "Zdob si Zdub - Видели ночь", duration: 10 },
        { url: 'https://youtu.be/vx2u5uUu3DE?t=58', name: "Bon Jovi - It's My Life", duration: 10 },
        { url: 'https://youtu.be/eVTXPUF4Oz4?t=54', name: "Linkin Park - In The End", duration: 10 },
        { url: 'https://youtu.be/-tJYN-eG1zk?t=29', name: "Queen - We Will Rock You", duration: 10 },
        { url: 'https://youtu.be/nj5nuYYrZvg?t=45', name: "Мумий Тролль - Владивосток 2000", duration: 10 },
        { url: 'https://youtu.be/VMS30oV8ApE?t=67', name: "Валентин Стрыкало - Наше лето", duration: 10 },
        { url: 'https://youtu.be/spDy95Sww6k?t=53', name: "Animal ДжаZ - Три полоски", duration: 10 },
        { url: 'https://youtu.be/SAUbHAwTJ-Y?t=64', name: "Валерий Меладзе - Самба белого мотылька", duration: 10 },
        { url: 'https://youtu.be/qN1JUvS2kqo?t=64', name: "Ирина Аллегрова - Угонщица", duration: 10 },
        { url: 'https://youtu.be/_-nvcdBzDWs?t=62', name: "Ирина Аллегрова - Младший лейтенант", duration: 10 },
        { url: 'https://youtu.be/mV5xJT7BnzE?t=58', name: "Ёлка - Прованс", duration: 10 },
        { url: 'https://youtu.be/Q8WJz-DmPVg?t=55', name: "МакSим - Знаешь ли ты", duration: 10 },
        { url: 'https://youtu.be/_djms7Knbos?t=78', name: "t.A.T.u. - Нас не догонят", duration: 10 },
        { url: 'https://youtu.be/tnZPDs9qepA?t=74', name: "Бумбокс - Вахтерам", duration: 10 },
        { url: 'https://youtu.be/8zHjanBzZt8?t=55', name: "Каста — Вокруг шум", duration: 10 },
        { url: 'https://youtu.be/G7KNmW9a75Y?t=33', name: "Miley Cyrus - Flowers", duration: 10 },
        { url: 'https://youtu.be/tAp9BKosZXs?t=33', name: "Katy Perry - I Kissed A Girl", duration: 10 },
        { url: 'https://youtu.be/rFvV5_UnSeM?t=142', name: "SEREBRO - МАМА ЛЮБА", duration: 10 },
        { url: 'https://youtu.be/t_la20ZBpCQ?t=71', name: "Руки Вверх! - 18 мне уже", duration: 10 },
        { url: 'https://youtu.be/lvCErYl62Zs?t=58', name: "Иванушки Int. - Тополиный пух", duration: 10 },
        { url: 'https://youtu.be/0fmOMnjHGuA?t=48', name: "ВИА Гра - Попытка №5", duration: 10 },
        { url: 'https://youtu.be/CTQxNgCejVg?t=67', name: "Звери - Дожди-пистолеты", duration: 10 },
        { url: 'https://youtu.be/EsX-0VBb0j0?t=47', name: "Макс Корж — Жить в кайф", duration: 10 },
        { url: 'https://youtu.be/fou72UMdG0k?t=59', name: "Градусы — Голая", duration: 10 },
        { url: 'https://youtu.be/yUp01GbQxTw?t=53', name: "Король и Шут - Кукла колдуна", duration: 10 },
        { url: 'https://youtu.be/0JMdXFHo5SY?t=62', name: "КАТЯ ЛЕЛЬ - Мой мармеладный", duration: 10 },
        { url: 'https://youtu.be/N_ML7DbTRFw?t=40', name: "Натали - О боже, какой мужчина!", duration: 10 },
        { url: 'https://youtu.be/lluIQebmAMM?t=71', name: "Он тебя целует", duration: 10 },
        { url: 'https://youtu.be/Bx8Fo7WRpXg?t=32', name: "Султан Лагучев - Горький вкус", duration: 10 },
      ],
      players: [],
      fields: [],
    },
  ]
}

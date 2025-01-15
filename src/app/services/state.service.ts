import { Injectable } from '@angular/core';
import { IGame, IGameRound, IGameVideo, IPlayer, IFieldCell, IReadyGame, IRound, IVideo } from '../models/models';
import { environment } from '../../environments/environment';
import { extractTimestamp, extractVideoId, getMusician } from '../utils/utils';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  public simulation = false;
  showCards = false;
  public $nextRound = new Subject();
  public logo = 'Una'

  game: IReadyGame = {
    id: 0,
    doubleWin: false,
    winners: new Set(),
    rounds: [],
  };

  constructor() { }

  initGame() {

    const storedGameString = localStorage.getItem('muz-loto-game');
    if (storedGameString) {
      const storedGame = JSON.parse(storedGameString);
      this.game = {
        ...storedGame,
        winners: new Set([]),
        rounds: storedGame.rounds.map((round: IGameRound) => ({
          ...round,
          videos: new Set(round.videos),
          players: round.players.map(player => ({
            ...player,
            lines: player.lines.map(line => new Set(line)),
            linesSimulation: player.linesSimulation.map(lineSimulation => new Set(lineSimulation))
          }))
        }))
      }
    } else {
      this.game = {
        id: Math.floor(Math.random() * 10001),
        doubleWin: game.doubleWin,
        winners: new Set(),
        rounds: game.rounds.map((round, index) => {
          const videos = [...round.videos].sort(() => Math.random() - 0.5);
          let videosForFields = [...videos];
          let fields: IFieldCell[][] = [];
          if ([...round.videos].length !== round.roundFieldRows * round.roundFieldColumns) {
            alert('Несходится поле');
          }
          if (round.fields.length) {
            fields = round.fields;
          } else {
            for (let i = 0; i < round.roundFieldRows; i++) {
              const cells: IFieldCell[] = [];
              for (let i2 = 0; i2 < round.roundFieldColumns; i2++) {
                const video = videosForFields[Math.floor(Math.random() * videosForFields.length)];
                videosForFields = videosForFields.filter(({ url }) => url !== video.url)
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
            steps: [],
            savedSteps: [],
            winners: [],
            active: false,
            fields,
            players: round.players.length ? round.players : this.createCards(round, fields.flat()),
            videos: new Set(fields.flat().map((field, index) => {
              const videoObject = videos.find(video => extractVideoId(video.url) === field.videoId)!;
              return {
                name: videoObject.name,
                number: index + 1,
                id: extractVideoId(videoObject.url)!,
                start: extractTimestamp(videoObject.url)!,
                played: false,
                class: '',
                priority: videoObject.priority
              }
            }))
          }
          return gameRound;
        }),


      };
    }
    // console.log([...new Set(this.game.rounds.map(round => [...round.videos].map(video => video.name.split(';')[0])).flat())].join(', '))
  }

  public saveGame() {
    localStorage.setItem('muz-loto-game', JSON.stringify({
      ...this.game,
      winners: [...this.game.winners],
      rounds: this.game.rounds.map(round => ({
        ...round,
        videos: [...round.videos],
        players: round.players.map(player => ({
          ...player,
          lines: player.lines.map(line => [...line]),
          linesSimulation: player.linesSimulation.map(lineSimulation => [...lineSimulation])
        }))
      }))
    }));
  }

  createCards(round: IRound, fields: IFieldCell[]): IPlayer[] {
    const players: IPlayer[] = [];
    let playerNumber = 1;
    const hashSet = new Set();
    for (let i = 1; i <= environment.cardsCount; i++) {
      let unusedVideos = [...fields].sort(() => Math.random() - 0.5);
      const rows = [];
      for (let i2 = 0; i2 < round.playerFieldRows; i2++) {
        const cells: IFieldCell[] = [];
        for (let i3 = 0; i3 < round.playerFieldColumns; i3++) {
          const selectedVideo = unusedVideos[Math.floor(Math.random() * unusedVideos.length)];
          unusedVideos = unusedVideos.filter(video => video.videoId !== selectedVideo.videoId);
          cells.push(selectedVideo);
        }
        rows.push(cells);
      }
      const lines = rows.map(row => new Set(row.map(field => field.videoId)));
      const linesSimulation = rows.map(row => new Set(row.map(field => field.videoId)));

      for (let i4 = 0; i4 < round.playerFieldColumns; i4++) {
        lines.push(new Set(rows.map(row => row[i4].videoId)))
        linesSimulation.push(new Set(rows.map(row => row[i4].videoId)))
      }
      const hash = JSON.stringify(rows);
      if (hashSet.has(hash)) {
        console.log('skip')
        continue;
      }
      hashSet.add(hash);
      players.push({
        number: playerNumber++,
        fields: rows,
        lines,
        linesSimulation,
      });

    }
    return players;
  }
}

const game: IGame = {
  doubleWin: false,
  rounds: [
    {
      name: 'Раунд №1',
      roundFieldColumns: 7,
      roundFieldRows: 6,
      playerFieldColumns: 5,
      playerFieldRows: 5,
      lineWinners: 2,
      crossWinners: 1,
      allWinners: 1,
      doubleWin: false,
      videos: [
        { url: "https://youtu.be/LMuDrj5BpM0?t=48", name: "AC/DC;Highway to Hell", priority: true },
        { url: "https://youtu.be/VyZeqzWvR7w?t=38", name: "Bon Jovi;It's My Life", priority: true },
        { url: "https://youtu.be/C3KPlowsyJs?t=30", name: "Katy Perry;I Kissed A Girl", priority: true },
        { url: "https://youtu.be/l5t9IXtTr6g?t=56", name: "Radiohead;Creep", priority: true },
        { url: "https://youtu.be/8sM-rm4lFZg?t=79", name: "The Cranberries;Zombie", priority: true },
        { url: "https://youtu.be/c141WyYC6AM?t=39", name: "Hi-Fi;А мы любили", priority: true },
        { url: "https://youtu.be/mTVqRXY01aI?t=43", name: "LOBODA;Твои глаза", priority: true },
        { url: "https://youtu.be/yblMlH_JYUM?t=45", name: "SEREBRO;МАМА ЛЮБА", priority: true },
        { url: "https://youtu.be/fu4ZMfWPOH4?t=33", name: "Zdob si Zdub;Видели ночь", priority: true },
        { url: "https://youtu.be/oXb6jg3OTG0?t=54", name: "Ёлка;Прованс", priority: true },
        { url: "https://youtu.be/nMRjY2khgkE?t=62", name: "Андрей Губин;Девушки как звёзды", priority: true },
        { url: "https://youtu.be/54UspYYEaVs?t=40", name: "Блестящие;За четыре моря", priority: true },
        { url: "https://youtu.be/qvyLSXGwoMw?t=38", name: "Браво;Любите, девушки", priority: true },
        { url: "https://youtu.be/OzUzwhBWRr4?t=42", name: "Валерий Меладзе;Текила любовь", priority: true },
        { url: "https://youtu.be/49UpAFMhmP0?t=54", name: "Винтаж;Плохая девочка", priority: true },
        { url: "https://youtu.be/D3AbZVQTG-w?t=43", name: "ВИА Гра;Попытка №5", priority: true },
        { url: "https://youtu.be/SzlGR9ValNc?t=72", name: "Глюк’oZa;Невеста", priority: true },
        { url: "https://youtu.be/32kBLclkumI?t=45", name: "Город 312;Вне зоны доступа", priority: true },
        { url: "https://youtu.be/d8G7_Cxl-_I?t=57", name: "Градусы;Голая", priority: true },
        { url: "https://youtu.be/hKXDDpoqvnI?t=65", name: "ДЕМО;Солнышко", priority: true },
        { url: "https://youtu.be/ebPdskNpzQI?t=45", name: "Жанна Фриске;Ла-ла-ла", priority: true },
        { url: "https://youtu.be/NqAp7l82UaI?t=84", name: "Звери;До скорой встречи", priority: true },
        { url: "https://youtu.be/hhpIU5U2N24?t=71", name: "Жуки;Батарейка", priority: true },
        { url: "https://youtu.be/qKuTh2xmGWg?t=47", name: "Земфира;Ромашки", priority: true },
        { url: "https://youtu.be/kBs40FFOZrE?t=116", name: "МакSим;Вертром стать", priority: true },
        { url: "https://youtu.be/jjhn8-U9Kl8?t=127", name: "Ирина Аллегрова;Младший лейтенант", priority: true },
        { url: "https://youtu.be/avq3kIvqn-o?t=51", name: "Каста;Вокруг шум", priority: true },
        { url: "https://youtu.be/18jjqM4-OFg?t=59", name: "Катя Лель;Мой Мармеладный", priority: true },
        { url: "https://youtu.be/-0TCsm-O45Y?t=42", name: "Корни;С днем рождения Вика", priority: true },
        { url: "https://youtu.be/fd0miVbzU30?t=19", name: "Король и Шут;Прыгну со скалы", priority: true },
        { url: "https://youtu.be/ePa2g0Igsr8?t=74", name: "Леонид Агутин;Остров", priority: true },
        { url: "https://youtu.be/OQhuqA6UhmE?t=44", name: "Макс Корж;Жить в кайф", priority: true },
        { url: "https://youtu.be/KVvZjwX35wI?t=993", name: "Многоточие;В жизни так бывает", priority: false },
        { url: "https://youtu.be/YjCOZvoFiTc?t=112", name: "Мумий Тролль;Невеста", priority: true },
        { url: "https://youtu.be/W8IRmYdgUXg?t=58", name: "Отпетые Мошенники;Девушки бывают разные", priority: true },
        { url: "https://youtu.be/8U_MiEAjhDc?t=74", name: "ПОРНОФИЛЬМЫ;Я так соскучился", priority: true },
        { url: "https://youtu.be/60w93RcyKeg?t=55", name: "Руки Вверх!;Чужие Губы", priority: true },
        { url: "https://youtu.be/XakXGfd07hk?t=40", name: "Сплин;Выхода нет", priority: true },
        { url: "https://youtu.be/0uGEVMd2pyE?t=41", name: "Фактор 2;Красавица", priority: true },
        { url: "https://youtu.be/TS7gm1GPwNI?t=26", name: "ФАБРИКА;Про любовь", priority: true },
        { url: "https://youtu.be/vd_-qkJdGfw?t=76", name: "ТаТу;Нас не догонят", priority: true },
        { url: "https://youtu.be/JjyiuU5T2ag?t=90", name: "Юлия Савичева;Если в сердце живёт любовь", priority: true },

      ],
      players: [],
      fields: [],
    },
    {
      name: 'Раунд №2',
      roundFieldColumns: 7,
      roundFieldRows: 6,
      playerFieldColumns: 5,
      playerFieldRows: 5,
      lineWinners: 1,
      crossWinners: 1,
      allWinners: 1,
      doubleWin: false,
      videos: [
        { url: "https://youtu.be/3K7BsS6_AVw?t=61", name: "The Killers;Somebody Told Me", priority: true },
        { url: "https://youtu.be/DYx-gywi7Dk?t=34", name: "Quest Pistols;Ты Так Красива", priority: true },
        { url: "https://youtu.be/R6ubXNlHFow?t=30", name: "Katy Perry;Hot N Cold", priority: true },
        { url: "https://youtu.be/Tx_CNm7oLCg?t=45", name: "Kaiser Chiefs;Ruby", priority: true },
        { url: "https://youtu.be/SSbBvKaM6sk?t=13", name: "Blur;Song 2", priority: true },
        { url: "https://youtu.be/iawgB2CDCrw?t=30", name: "Miley Cyrus;Flowers", priority: true },
        { url: "https://youtu.be/NbRAH7xTXHg?t=55", name: "ТаТу;Я сошла с ума", priority: true },
        { url: "https://youtu.be/ZQxqQ6-3yAE?t=41", name: "Ундервуд;Гагарин, я вас любила", priority: true },
        { url: "https://youtu.be/nKpFuiANJyQ?t=47", name: "Танцы Минус;Город", priority: true },
        { url: "https://youtu.be/N1wBJkkjzW0?t=25", name: "Сплин;Орбит без сахара", priority: true },
        { url: "https://youtu.be/xno9GOi3FaI?t=123", name: "Руки Вверх!;Крошка моя", priority: true },
        { url: "https://youtu.be/0NK2sKZljcY?t=94", name: "Отпетые Мошенники;Люби меня, люби", priority: true },
        { url: "https://youtu.be/Ok1-XYV3k60?t=26", name: "Мумий Тролль;Утекай", priority: true },
        { url: "https://youtu.be/wpk3Iwo0Kr0?t=114", name: "Иванушки Int.;Тополиный пух", priority: true },
        { url: "https://youtu.be/44rsGyOANgw?t=132", name: "Кипелов;Я свободен", priority: true },
        { url: "https://youtu.be/sbSWDBk5Z7g?t=48", name: "Король и Шут;Кукла колдуна", priority: true },
        { url: "https://youtu.be/guRv3iguxkk?t=135", name: "ЛЕПРИКОНСЫ;Хали-гали, паратрупер", priority: true },
        { url: "https://youtu.be/y8lRv_aLL3I?t=83", name: "Лолита;На Титанике", priority: true },
        { url: "https://youtu.be/l2aQWEIipDs?t=50", name: "Мария Ржевская;Когда я стану кошкой", priority: true },
        { url: "https://youtu.be/pNSoGfaWx6o?t=66", name: "Монеточка;Каждый раз", priority: true },
        { url: "https://youtu.be/vfVIxW7DUYI?t=40", name: "Натали;О боже, какой мужчина!", priority: true },
        { url: "https://youtu.be/qN1JUvS2kqo?t=56", name: "Ирина Аллегрова;Угонщица", priority: true },
        { url: "https://youtu.be/GpV0hvsKmUQ?t=140", name: "Каста;Сочиняй мечты", priority: true },
        { url: "https://youtu.be/_v8fXKA5DI8?t=142", name: "МакSим;Знаешь ли ты", priority: true },
        { url: "https://youtu.be/Fxj4gAZkB0k?t=104", name: "Земфира;Бесконечность ", priority: true },
        { url: "https://youtu.be/CqZJ1aT1eYY?t=39", name: "Звери;Районы-кварталы", priority: true },
        { url: "https://youtu.be/qN9ylHPY6fQ?t=26", name: "Дискотека Авария;Если хочешь остаться", priority: true },
        { url: "https://youtu.be/HO5FbO0YcMg?t=131s", name: "Валентин Стрыкало;Наше лето", priority: true },
        { url: "https://youtu.be/k5ZRVPp8R0Q?t=31", name: "Верка сердючка;Всё будет хорошо", priority: true },
        { url: "https://youtu.be/b7G5twVZVHM?t=78", name: "Валерий Меладзе;Притяжения больше нет", priority: true },
        { url: "https://youtu.be/Fm-MiLnHwx4?t=38", name: "Блестящие;Восточные сказки", priority: true },
        { url: "https://youtu.be/GL0L2RbOZzg?t=50", name: "Андрей Губин;Ночь", priority: true },
        { url: "https://youtu.be/JGIeQSNGUpY?t=64", name: "Агата Кристи;Как на войне", priority: true },
        { url: "https://youtu.be/9OYy2IeZinI?t=47", name: "Алексей Чумаков;Необыкновенная", priority: true },
        { url: "https://youtu.be/EBEhwgFeeBc?t=26", name: "Hi-Fi;7 Лепесток", priority: true },
        { url: "https://youtu.be/czlg64LxNe8?t=122", name: "Animal ДжаZ;Три полоски", priority: true },
        { url: "https://youtu.be/RUb-7mM3gks?t=50", name: "BrainStorm;Выходные", priority: true },
        { url: "https://youtu.be/vaj2PTDzeio?t=139", name: "Бумбокс;Вахтерам", priority: true },
        { url: "https://youtu.be/PVcILgD1qBo?t=50", name: "Город 312;Останусь", priority: true },
        { url: "https://youtu.be/NU-XAxBkEaE?t=76", name: "Децл;Вечеринка", priority: true },
        { url: "https://youtu.be/41iMX5ngwV0?t=72", name: "Баста;Сансара", priority: true },
        { url: "https://youtu.be/2daL-oy01nU?t=56", name: "Noize MC;Выдыхай", priority: false },
      ],
      players: [],
      fields: [],
    },
  ]
}
const songs = [
  { url: "https://youtu.be/LMuDrj5BpM0?t=48", name: "AC/DC;Highway to Hell", priority: true },
  { url: "https://youtu.be/VyZeqzWvR7w?t=38", name: "Bon Jovi;It's My Life", priority: true },
  { url: "https://youtu.be/C3KPlowsyJs?t=30", name: "Katy Perry;I Kissed A Girl", priority: true },
  { url: "https://youtu.be/l5t9IXtTr6g?t=56", name: "Radiohead;Creep", priority: true },
  { url: "https://youtu.be/8sM-rm4lFZg?t=79", name: "The Cranberries;Zombie", priority: true },
  { url: "https://youtu.be/c141WyYC6AM?t=39", name: "Hi-Fi;А мы любили", priority: true },
  { url: "https://youtu.be/mTVqRXY01aI?t=43", name: "LOBODA;ТВои глаза", priority: true },
  { url: "https://youtu.be/yblMlH_JYUM?t=45", name: "SEREBRO;МАМА ЛЮБА", priority: true },
  { url: "https://youtu.be/fu4ZMfWPOH4?t=33", name: "Zdob si Zdub;Видели ночь", priority: true },
  { url: "https://youtu.be/oXb6jg3OTG0?t=54", name: "Ёлка;Прованс", priority: true },
  { url: "https://youtu.be/nMRjY2khgkE?t=62", name: "Андрей Губин;Девушки как звёзды", priority: true },
  { url: "https://youtu.be/54UspYYEaVs?t=40", name: "Блестящие;За четыре моря", priority: true },
  { url: "https://youtu.be/qvyLSXGwoMw?t=38", name: "Браво;Любите, девушки", priority: true },
  { url: "https://youtu.be/OzUzwhBWRr4?t=42", name: "Валерий Меладзе;Текила любовь", priority: true },
  { url: "https://youtu.be/49UpAFMhmP0?t=54", name: "Винтаж;Плохая девочка", priority: true },
  { url: "https://youtu.be/D3AbZVQTG-w?t=43", name: "ВИА Гра;Попытка №5", priority: true },
  { url: "https://youtu.be/SzlGR9ValNc?t=72", name: "Глюк’oZa;Невеста", priority: true },
  { url: "https://youtu.be/32kBLclkumI?t=45", name: "Город 312;Вне зоны доступа", priority: true },
  { url: "https://youtu.be/d8G7_Cxl-_I?t=57", name: "Градусы;Голая", priority: true },
  { url: "https://youtu.be/hKXDDpoqvnI?t=65", name: "ДЕМО;Солнышко", priority: true },
  { url: "https://youtu.be/ebPdskNpzQI?t=45", name: "Жанна Фриске;Ла-ла-ла", priority: true },
  { url: "https://youtu.be/NqAp7l82UaI?t=84", name: "Звери;До скорой встречи", priority: true },
  { url: "https://youtu.be/hhpIU5U2N24?t=71", name: "Жуки;Батарейка", priority: true },
  { url: "https://youtu.be/qKuTh2xmGWg?t=47", name: "Земфира;Ромашки", priority: true },
  { url: "https://youtu.be/kBs40FFOZrE?t=116", name: "МакSим;Вертром стать", priority: true },
  { url: "https://youtu.be/jjhn8-U9Kl8?t=127", name: "Ирина Аллегрова;Младший лейтенант", priority: true },
  { url: "https://youtu.be/avq3kIvqn-o?t=51", name: "Каста;Вокруг шум", priority: true },
  { url: "https://youtu.be/18jjqM4-OFg?t=59", name: "Катя Лель;Мой Мармеладный", priority: true },
  { url: "https://youtu.be/-0TCsm-O45Y?t=42", name: "Корни;С днем рождения Вика", priority: true },
  { url: "https://youtu.be/fd0miVbzU30?t=19", name: "Король и Шут;Прыгну со скалы", priority: true },
  { url: "https://youtu.be/ePa2g0Igsr8?t=74", name: "Леонид Агутин;Остров", priority: true },
  { url: "https://youtu.be/OQhuqA6UhmE?t=44", name: "Макс Корж;Жить в кайф", priority: true },
  { url: "https://youtu.be/KVvZjwX35wI?t=993", name: "Многоточие;В жизни так бывает", priority: false },
  { url: "https://youtu.be/YjCOZvoFiTc?t=112", name: "Мумий Тролль;Невеста", priority: true },
  { url: "https://youtu.be/W8IRmYdgUXg?t=58", name: "Отпетые Мошенники;Девушки бывают разные", priority: true },
  { url: "https://youtu.be/8U_MiEAjhDc?t=74", name: "ПОРНОФИЛЬМЫ;Я так соскучился", priority: true },
  { url: "https://youtu.be/60w93RcyKeg?t=55", name: "Руки Вверх!;Чужие Губы", priority: true },
  { url: "https://youtu.be/XakXGfd07hk?t=40", name: "Сплин;Выхода нет", priority: true },
  { url: "https://youtu.be/0uGEVMd2pyE?t=41", name: "Фактор 2;Красавица", priority: true },
  { url: "https://youtu.be/TS7gm1GPwNI?t=26", name: "ФАБРИКА;Про любовь", priority: true },
  { url: "https://youtu.be/vd_-qkJdGfw?t=76", name: "ТаТу;Нас не догонят", priority: true },
  { url: "https://youtu.be/JjyiuU5T2ag?t=90", name: "Юлия Савичева;Если в сердце живёт любовь", priority: true },

  { url: "https://youtu.be/3K7BsS6_AVw?t=61", name: "The Killers;Somebody Told Me", priority: true },
  { url: "https://youtu.be/DYx-gywi7Dk?t=34", name: "Quest Pistols;Ты Так Красива", priority: true },
  { url: "https://youtu.be/R6ubXNlHFow?t=30", name: "Katy Perry;Hot N Cold", priority: true },
  { url: "https://youtu.be/Tx_CNm7oLCg?t=45", name: "Kaiser Chiefs;Ruby", priority: true },
  { url: "https://youtu.be/SSbBvKaM6sk?t=13", name: "Blur;Song 2", priority: true },
  { url: "https://youtu.be/iawgB2CDCrw?t=30", name: "Miley Cyrus;Flowers", priority: true },
  { url: "https://youtu.be/NbRAH7xTXHg?t=55", name: "ТаТу;Я сошла с ума", priority: true },
  { url: "https://youtu.be/ZQxqQ6-3yAE?t=41", name: "Ундервуд;Гагарин, я вас любила", priority: true },
  { url: "https://youtu.be/nKpFuiANJyQ?t=47", name: "Танцы Минус;Город", priority: true },
  { url: "https://youtu.be/N1wBJkkjzW0?t=25", name: "Сплин;Орбит без сахара", priority: true },
  { url: "https://youtu.be/xno9GOi3FaI?t=123", name: "Руки Вверх!;Крошка моя", priority: true },
  { url: "https://youtu.be/0NK2sKZljcY?t=94", name: "Отпетые Мошенники;Люби меня, люби", priority: true },
  { url: "https://youtu.be/Ok1-XYV3k60?t=26", name: "Мумий Тролль;Утекай", priority: true },
  { url: "https://youtu.be/wpk3Iwo0Kr0?t=114", name: "Иванушки Int.;Тополиный пух", priority: true },
  { url: "https://youtu.be/44rsGyOANgw?t=132", name: "Кипелов;Я свободен", priority: true },
  { url: "https://youtu.be/sbSWDBk5Z7g?t=48", name: "Король и Шут;Кукла колдуна", priority: true },
  { url: "https://youtu.be/guRv3iguxkk?t=135", name: "ЛЕПРИКОНСЫ;Хали-гали, паратрупер", priority: true },
  { url: "https://youtu.be/y8lRv_aLL3I?t=83", name: "Лолита;На Титанике", priority: true },
  { url: "https://youtu.be/l2aQWEIipDs?t=50", name: "Мария Ржевская;Когда я стану кошкой", priority: true },
  { url: "https://youtu.be/pNSoGfaWx6o?t=66", name: "Монеточка;Каждый раз", priority: true },
  { url: "https://youtu.be/vfVIxW7DUYI?t=40", name: "Натали;О боже, какой мужчина!", priority: true },
  { url: "https://youtu.be/qN1JUvS2kqo?t=56", name: "Ирина Аллегрова;Угонщица", priority: true },
  { url: "https://youtu.be/GpV0hvsKmUQ?t=140", name: "Каста;Сочиняй мечты", priority: true },
  { url: "https://youtu.be/_v8fXKA5DI8?t=142", name: "МакSим;Знаешь ли ты", priority: true },
  { url: "https://youtu.be/Fxj4gAZkB0k?t=104", name: "Земфира;Бесконечность ", priority: true },
  { url: "https://youtu.be/CqZJ1aT1eYY?t=39", name: "Звери;Районы-кварталы", priority: true },
  { url: "https://youtu.be/qN9ylHPY6fQ?t=26", name: "Дискотека Авария;Если хочешь остаться", priority: true },
  { url: "https://youtu.be/HO5FbO0YcMg?t=131s", name: "Валентин Стрыкало;Наше лето", priority: true },
  { url: "https://youtu.be/k5ZRVPp8R0Q?t=31", name: "Верка сердючка;Всё будет хорошо", priority: true },
  { url: "https://youtu.be/b7G5twVZVHM?t=78", name: "Валерий Меладзе;Притяжения больше нет", priority: true },
  { url: "https://youtu.be/Fm-MiLnHwx4?t=38", name: "Блестящие;Восточные сказки", priority: true },
  { url: "https://youtu.be/GL0L2RbOZzg?t=50", name: "Андрей Губин;Ночь", priority: true },
  { url: "https://youtu.be/JGIeQSNGUpY?t=64", name: "Агата Кристи;Как на войне", priority: true },
  { url: "https://youtu.be/9OYy2IeZinI?t=47", name: "Алексей Чумаков;Необыкновенная", priority: true },
  { url: "https://youtu.be/EBEhwgFeeBc?t=26", name: "Hi-Fi;7 Лепесток", priority: true },
  { url: "https://youtu.be/czlg64LxNe8?t=122", name: "Animal ДжаZ;Три полоски", priority: true },
  { url: "https://youtu.be/RUb-7mM3gks?t=50", name: "BrainStorm;Выходные", priority: true },
  { url: "https://youtu.be/vaj2PTDzeio?t=139", name: "Бумбокс;Вахтерам", priority: true },
  { url: "https://youtu.be/PVcILgD1qBo?t=50", name: "Город 312;Останусь", priority: true },
  { url: "https://youtu.be/NU-XAxBkEaE?t=76", name: "Децл;Вечеринка", priority: true },
  { url: "https://youtu.be/41iMX5ngwV0?t=72", name: "Баста;Сансара", priority: true },
  { url: "https://youtu.be/2daL-oy01nU?t=56", name: "Noize MC;Выдыхай", priority: false },

  { url: "https://youtu.be/oXrgoLkG8pg?t=53", name: "Браво;Дорога в облака", priority: false },
  { url: "https://youtu.be/rINa_BbHzZs?t=31", name: "The Beatles;Yellow Submarine", priority: true },
  { url: "https://youtu.be/C_hsGFpA1ik?t=49", name: "Дима Билан;Невозможное возможно", priority: true },
  { url: "https://youtu.be/YCCDQfYMo0s?t=22", name: "Jaxomy & Co;Pedro", priority: true },
  { url: "https://youtu.be/4aVBzpr7RIo?t=23", name: "AP$ENT;Можно я с тобой?", priority: true },
  { url: "https://youtu.be/TXGbhniTBrU?t=22", name: "Queen;We Will Rock You", priority: true },
  { url: "https://youtu.be/_UZONrzoFrY?t=48", name: "Bob Dylan;Knockin' on Heaven's Door", priority: false },
  { url: "https://youtu.be/dWciK2-idhk?t=97", name: "Gorillaz;Clint Eastwood", priority: false },
  { url: "https://youtu.be/W0DM5lcj6mw?t=52", name: "Imagine Dragons;Believer", priority: false },
  { url: "https://youtu.be/hHB1Ikzfpmc?t=30", name: "Imagine Dragons;Enemy", priority: false },
  { url: "https://youtu.be/OF04pKp-r9o?t=94", name: "Kesha ;TiK ToK", priority: true },
  { url: "https://youtu.be/4jSGMJZv764?t=46", name: "Lenny Kravitz;Fly Away", priority: false },
  { url: "https://youtu.be/d_toKURCt10?t=53", name: "Linkin Park;In The End", priority: false },
  { url: "https://youtu.be/kJQP7kiw5Fk?t=80", name: "Luis Fonsi;Despacito", priority: false },
  { url: "https://youtu.be/8a-9Sd35HNI?t=29", name: "Red Hot Chili Peppers;Can't Stop", priority: true },
  { url: "https://youtu.be/DOckYuS32iY?t=41", name: "System Of A Down;Chop Suey", priority: false },
  { url: "https://youtu.be/An7jqlIu-0I?t=47", name: "The Black Eyed Peas;Let's Get It Started", priority: false },
  { url: "https://youtu.be/HoOhk9iGxE4?t=72", name: "The Offspring;Pretty Fly", priority: false },
  { url: "https://youtu.be/z2AmjZbEWgE?t=69", name: "Банд'Эрос;Коламбия Пикчерз не представляет", priority: false },
  { url: "https://youtu.be/pkeawfNnzjw?t=50", name: "Валерий Меладзе;Салют, Вера", priority: true },
  { url: "https://youtu.be/7HhFaPgFwj0?t=56", name: "Валерий Меладзе;Самбо белого мотылька", priority: true },
  { url: "https://youtu.be/CTQxNgCejVg?t=62", name: "Звери;Дожди-пистолеты", priority: true },
  { url: "https://youtu.be/jCmOPKJX8wA?t=57", name: "Иракли;Лондон Париж", priority: false },
  { url: "https://youtu.be/M4UtiYaOjmg?t=99", name: "Михей и Джуманджи;Сука-любовь", priority: false },
  { url: "https://youtu.be/rD2J_ocb3cU?t=33", name: "Мумий Тролль;Владивосток 2000", priority: true },
  { url: "https://youtu.be/dijcAFMkgk0?t=80", name: "Рок-Острова;Ничего не говори", priority: false },
  { url: "https://youtu.be/t_la20ZBpCQ?t=62", name: "Руки Вверх!;18 мне уже", priority: true },
  { url: "https://youtu.be/oz0NAYehGc0?t=52", name: "Руки Вверх!;Алёшка", priority: true },
  { url: "https://youtu.be/v5DBulc5nA0?t=29", name: "Султан Лагучев;Горький вкус", priority: true },
  { url: "https://youtu.be/LKTalcjnE2U?t=19", name: "Элджей & Feduk;Розовое вино", priority: false },
]

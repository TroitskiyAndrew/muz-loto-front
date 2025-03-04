import { Injectable } from '@angular/core';
import { ISong, ISongWithSettings, NEW_IGame, NEW_IGameSettings, NEW_IRoundSettings, NEW_IRoundSong, NEW_ITicket, NEW_ITicketRound, NEW_ITicketsSettings, Winner } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class CreatorService {
  private gameSettings: NEW_IGameSettings = {
    rounds: [
      {
        roundFieldColumns: 7,
        roundFieldRows: 6,
        notRusSongs: 6,
      },
      {
        roundFieldColumns: 7,
        roundFieldRows: 6,
        notRusSongs: 4,
      },
    ],
  };

  private ticketsSettings: NEW_ITicketsSettings = {
    count: 42,
    rounds: [
      {
        ticketFieldColumns: 5,
        ticketFieldRows: 5,
      },
      {
        ticketFieldColumns: 5,
        ticketFieldRows: 5,
      }
    ]
  };


  constructor() { }

  public generateGame(): NEW_IGame {
    // ToDo Получать от юзера
    const settings = this.gameSettings;
    // ToDo Получать от юзера
    const songs: ISongWithSettings[] = storedSongs.map(song => ({
      ...song,
      priority: true,
      disabled: false,
    }))
    const randomizedSongs = songs
      .filter((song) => !song.disabled)
      .sort(() => Math.random() - 0.5);
    const prioritySongs = randomizedSongs.filter((song) => song.priority);
    const nonPrioritySongs = randomizedSongs.filter((song) => !song.priority);
    const usedSongs = new Set<string>();
    return {
      id: String(Math.floor(Math.random() * 10001)),
      rounds: settings.rounds.map((round, index) => {
        const usedArtists = new Set<string>();
        const songs: ISong[] = [];
        this.addSongs(songs, prioritySongs, usedSongs, usedArtists, round);
        this.addSongs(songs, nonPrioritySongs, usedSongs, usedArtists, round);
        if (songs.length !== round.roundFieldColumns * round.roundFieldRows) {
          alert('Количество песен не совпадает')
        }
        songs.sort(() => Math.random() - 0.5);
        const roundSongs: NEW_IRoundSong[] = songs.map((song, index) => ({ ...song, number: index, class: '', played: false }));
        const field: NEW_IRoundSong[][] = [];
        let songIndex = 0;
        for (let rowIndex = 0; rowIndex < round.roundFieldRows; rowIndex++) {
          const row = [];
          for (let columnIndex = 0; columnIndex < round.roundFieldColumns; columnIndex++) {
            row.push(roundSongs[songIndex++]);
          }
          field.push(row);
        }
        return {
          name: `Раунд №${index + 1}`,
          field,
        };
      }),
    };
  }

  private addSongs(
    result: ISong[],
    songs: ISongWithSettings[],
    usedSongs: Set<string>,
    usedArtists: Set<string>,
    round: NEW_IRoundSettings,
  ): ISong[] {
    let rusSongsNeed = round.roundFieldRows * round.roundFieldColumns - round.notRusSongs - result.filter(song => song.rus).length;
    let notRusSongsNeed = round.notRusSongs - result.filter(song => !song.rus).length;
    songs.forEach(song => {
      if (!usedSongs.has(song.id) && !usedArtists.has(song.artist)) {
        if (song.rus && rusSongsNeed) {
          result.push(song);
          rusSongsNeed--;
          usedSongs.add(song.id);
          usedArtists.add(song.artist);
        }
        if (!song.rus && notRusSongsNeed) {
          result.push(song);
          notRusSongsNeed--;
          usedSongs.add(song.id);
          usedArtists.add(song.artist);
        }
      }
    })
    return result;
  }

  public generateTickets(game: NEW_IGame): NEW_ITicket[] {
    // ToDo Получать от юзера
    const settings = this.ticketsSettings;
    const result: NEW_ITicket[] = [];
    for (let ticketIndex = 0; ticketIndex < settings.count; ticketIndex++) {
      const ticket: NEW_ITicket = {
        number: ticketIndex + 1,
        rounds: []
      };
      for (let roundIndex = 0; roundIndex < game.rounds.length; roundIndex++) {
        const field = [];
        const roundSettings = settings.rounds[roundIndex];
        if (!roundSettings) {
          alert('Нет настроек для раунда');
        }

        if (roundSettings.ticketFieldColumns * roundSettings.ticketFieldRows > game.rounds[roundIndex].field.flat().length) {
          alert('В билете не может быть больше песен');
        }
        const songs = [...game.rounds[roundIndex].field.flat()].sort(() => Math.random() - 0.5);

        let songIndex = 0;
        for (let rowIndex = 0; rowIndex < roundSettings.ticketFieldRows; rowIndex++) {
          const row = [];
          for (let columnIndex = 0; columnIndex < roundSettings.ticketFieldColumns; columnIndex++) {
            row.push(songs[songIndex++]);
          }
          field.push(row);
        }
        ticket.rounds.push({ field });
      }

      result.push(ticket)
    }
    return result;
  }

  public generateOrder(game: NEW_IGame, tickets: NEW_ITicket[], attempt = 0): any {
  attempt++;
  if (attempt === 1000) {
    return null;
  }
  console.log('attempt ', attempt)
  const allWinners = [];
  for (let roundIndex = 0; roundIndex < game.rounds.length; roundIndex++) {
    const winners = this.simulateRound(game, tickets, roundIndex);
    allWinners.push(...winners)
  }
  if (allWinners.length > 6) {
    this.generateOrder(game, tickets, attempt);
  }
  return null;
}

  private simulateRound(game: NEW_IGame, tickets: NEW_ITicket[], round: number){
  const songs = [...game.rounds[round].field.flat()].sort(() => Math.random() - 0.5);
  const lineWinners = [];
  const crossWinners = [];
  const allWinners = [];
  for (const song of songs) {
    if (lineWinners.length === 0) {
      const winners = this.trySong(song, tickets, round, Winner.Line);
      lineWinners.push(...winners);
      continue;
    }
    if (crossWinners.length === 0) {
      const winners = this.trySong(song, tickets, round, Winner.Cross);
      crossWinners.push(...winners);
      continue;
    }
    if (allWinners.length === 0) {
      const winners = this.trySong(song, tickets, round, Winner.All);
      allWinners.push(...winners);
      continue;
    }

  }
  return [...lineWinners, ...crossWinners, ...allWinners];
}

  private trySong(song: NEW_IRoundSong, tickets: NEW_ITicket[], round: number, type: Winner): number[] {
  const winners: number[] = [];

  tickets.forEach(ticket => {
    const lines = ticket.rounds[round].field.map(
      (row) => new Set(row.map((song) => song.id))
    );
    const horizontalLines = lines.slice(0,6);
    const verticalLines = lines.slice(6);
    const verticalWin = verticalLines.some(line => line.has(song.id) && line.size === 1);
    const horizontalWin = horizontalLines.some(line => line.has(song.id) && line.size === 1);
    if (type === Winner.Line && (verticalWin || horizontalWin)) {
      winners.push(ticket.number)
    }
    if (type === Winner.Cross && (verticalWin && horizontalWin)) {
      winners.push(ticket.number)
    }
    if (type === Winner.All) {
      const rest = new Set([...verticalLines, ...horizontalLines].map(s => [...s]).flat());
      if (rest.has(song.id) && rest.size === 1) {
        winners.push(ticket.number);
      }
    }
    horizontalLines.forEach(line => line.delete(song.id));
    verticalLines.forEach(line => line.delete(song.id));
  })
  return winners;
}
}

const storedSongs: ISong[] = [
  {
    artist: 'AC/DC',
    name: 'Highway to Hell',
    rus: false,
    id: 'LMuDrj5BpM0',
    start: 48,
  },
  {
    artist: 'AP$ENT',
    name: 'Можно я с тобой?',
    rus: true,
    id: '4aVBzpr7RIo',
    start: 23,
  },
  {
    artist: 'Animal ДжаZ',
    name: 'Три полоски',
    rus: true,
    id: 'czlg64LxNe8',
    start: 122,
  },
  {
    artist: 'Avril Lavigne',
    name: 'Complicated ',
    rus: false,
    id: '5eGbnVlRcRg',
    start: 60,
  },
  { artist: 'Blur', name: 'Song 2', rus: false, id: 'SSbBvKaM6sk', start: 13 },
  {
    artist: 'Bob Dylan',
    name: "Knockin' on Heaven's Door",
    rus: false,
    id: '_UZONrzoFrY',
    start: 48,
  },
  {
    artist: 'Bon Jovi',
    name: "It's My Life",
    rus: false,
    id: 'VyZeqzWvR7w',
    start: 38,
  },
  {
    artist: 'BrainStorm',
    name: 'Выходные',
    rus: true,
    id: 'RUb-7mM3gks',
    start: 50,
  },
  {
    artist: 'Cream Soda & Хлеб',
    name: 'Плачу на техно',
    rus: true,
    id: '4ZurH8I_c9o',
    start: 33,
  },
  {
    artist: 'Eurythmics',
    name: 'Sweet Dreams',
    rus: false,
    id: 'bG9z-atG7gc',
    start: 4,
  },
  {
    artist: 'Gorillaz',
    name: 'Clint Eastwood',
    rus: false,
    id: 'dWciK2-idhk',
    start: 97,
  },
  {
    artist: 'Haddaway',
    name: 'What Is Love',
    rus: false,
    id: 'G8RY_XOqJf4',
    start: 59,
  },
  {
    artist: 'Hi-Fi',
    name: '7 Лепесток',
    rus: false,
    id: 'EBEhwgFeeBc',
    start: 26,
  },
  {
    artist: 'Hi-Fi',
    name: 'А мы любили',
    rus: true,
    id: 'c141WyYC6AM',
    start: 39,
  },
  {
    artist: 'Imagine Dragons',
    name: 'Enemy',
    rus: false,
    id: 'hHB1Ikzfpmc',
    start: 30,
  },
  {
    artist: 'Imagine Dragons',
    name: 'Believer',
    rus: false,
    id: 'W0DM5lcj6mw',
    start: 52,
  },
  {
    artist: 'Jaxomy & Co',
    name: 'Pedro',
    rus: false,
    id: 'YCCDQfYMo0s',
    start: 22,
  },
  {
    artist: 'Kaiser Chiefs',
    name: 'Ruby',
    rus: false,
    id: 'Tx_CNm7oLCg',
    start: 45,
  },
  {
    artist: 'Katy Perry',
    name: 'I Kissed A Girl',
    rus: false,
    id: 'C3KPlowsyJs',
    start: 30,
  },
  {
    artist: 'Katy Perry',
    name: 'Hot N Cold',
    rus: false,
    id: 'R6ubXNlHFow',
    start: 30,
  },
  {
    artist: 'Kesha ',
    name: 'TiK ToK',
    rus: false,
    id: 'OF04pKp-r9o',
    start: 94,
  },
  {
    artist: 'LOBODA',
    name: 'ТВои глаза',
    rus: true,
    id: 'mTVqRXY01aI',
    start: 43,
  },
  {
    artist: 'Lenny Kravitz',
    name: 'Fly Away',
    rus: false,
    id: '4jSGMJZv764',
    start: 46,
  },
  {
    artist: 'Linkin Park',
    name: 'In The End',
    rus: false,
    id: 'd_toKURCt10',
    start: 53,
  },
  {
    artist: 'Luis Fonsi',
    name: 'Despacito',
    rus: false,
    id: 'kJQP7kiw5Fk',
    start: 80,
  },
  {
    artist: 'Miley Cyrus',
    name: 'Flowers',
    rus: false,
    id: 'iawgB2CDCrw',
    start: 30,
  },
  {
    artist: 'Noize MC',
    name: 'Выдыхай',
    rus: true,
    id: '2daL-oy01nU',
    start: 56,
  },
  {
    artist: 'Queen',
    name: 'We Will Rock You',
    rus: false,
    id: 'TXGbhniTBrU',
    start: 22,
  },
  {
    artist: 'Quest Pistols',
    name: 'Ты Так Красива',
    rus: true,
    id: 'DYx-gywi7Dk',
    start: 34,
  },
  {
    artist: 'Quest Pistols',
    name: 'Я Устал',
    rus: true,
    id: '7gYPfRVVR0U',
    start: 26,
  },
  {
    artist: 'Radiohead',
    name: 'Creep',
    rus: false,
    id: 'l5t9IXtTr6g',
    start: 56,
  },
  {
    artist: 'Red Hot Chili Peppers',
    name: "Can't Stop",
    rus: false,
    id: '8a-9Sd35HNI',
    start: 29,
  },
  {
    artist: 'Roxette',
    name: 'Listen To Your Heart',
    rus: false,
    id: 'E310_bV4vEA',
    start: 40,
  },
  {
    artist: 'SEREBRO',
    name: 'МАМА ЛЮБА',
    rus: true,
    id: 'yblMlH_JYUM',
    start: 45,
  },
  {
    artist: 'Shakira',
    name: 'Whenever',
    rus: false,
    id: '5v-WAEvA7C4',
    start: 40,
  },
  {
    artist: 'System Of A Down',
    name: 'Chop Suey',
    rus: false,
    id: 'DOckYuS32iY',
    start: 41,
  },
  {
    artist: 'The Beatles',
    name: 'Yellow Submarine',
    rus: false,
    id: 'rINa_BbHzZs',
    start: 31,
  },
  {
    artist: 'The Black Eyed Peas',
    name: "Let's Get It Started",
    rus: false,
    id: 'An7jqlIu-0I',
    start: 47,
  },
  {
    artist: 'The Cranberries',
    name: 'Zombie',
    rus: false,
    id: '8sM-rm4lFZg',
    start: 79,
  },
  {
    artist: 'The Killers',
    name: 'Somebody Told Me',
    rus: false,
    id: '3K7BsS6_AVw',
    start: 61,
  },
  {
    artist: 'The Offspring',
    name: 'Pretty Fly',
    rus: false,
    id: 'HoOhk9iGxE4',
    start: 72,
  },
  {
    artist: 'Zdob si Zdub',
    name: 'Видели ночь',
    rus: false,
    id: 'fu4ZMfWPOH4',
    start: 33,
  },
  {
    artist: 'Агата Кристи',
    name: 'Как на войне',
    rus: true,
    id: 'JGIeQSNGUpY',
    start: 64,
  },
  {
    artist: 'Алексей Чумаков',
    name: 'Необыкновенная',
    rus: true,
    id: '9OYy2IeZinI',
    start: 47,
  },
  {
    artist: 'Андрей Губин',
    name: 'Ночь',
    rus: true,
    id: 'GL0L2RbOZzg',
    start: 50,
  },
  {
    artist: 'Андрей Губин',
    name: 'Девушки как звёзды',
    rus: true,
    id: 'nMRjY2khgkE',
    start: 62,
  },
  {
    artist: "Банд'Эрос",
    name: 'Коламбия Пикчерз не представляет',
    rus: true,
    id: 'z2AmjZbEWgE',
    start: 69,
  },
  { artist: 'Баста', name: 'Сансара', rus: true, id: '41iMX5ngwV0', start: 72 },
  {
    artist: 'Блестящие',
    name: 'За четыре моря',
    rus: true,
    id: '54UspYYEaVs',
    start: 40,
  },
  {
    artist: 'Блестящие',
    name: 'Восточные сказки',
    rus: true,
    id: 'Fm-MiLnHwx4',
    start: 38,
  },
  {
    artist: 'Браво',
    name: 'Любите, девушки',
    rus: true,
    id: 'qvyLSXGwoMw',
    start: 38,
  },
  {
    artist: 'Браво',
    name: 'Дорога в облака',
    rus: true,
    id: 'oXrgoLkG8pg',
    start: 53,
  },
  {
    artist: 'Бумбокс',
    name: 'Вахтерам',
    rus: true,
    id: 'vaj2PTDzeio',
    start: 139,
  },
  {
    artist: 'ВИА Гра',
    name: 'Попытка №5',
    rus: true,
    id: 'D3AbZVQTG-w',
    start: 43,
  },
  {
    artist: 'Валентин Стрыкало',
    name: 'Наше лето',
    rus: true,
    id: 'HO5FbO0YcMg',
    start: 131,
  },
  {
    artist: 'Валерий Меладзе',
    name: 'Самбо белого мотылька',
    rus: true,
    id: '7HhFaPgFwj0',
    start: 56,
  },
  {
    artist: 'Валерий Меладзе',
    name: 'Салют, Вера',
    rus: true,
    id: 'pkeawfNnzjw',
    start: 50,
  },
  {
    artist: 'Валерий Меладзе',
    name: 'Текила любовь',
    rus: true,
    id: 'OzUzwhBWRr4',
    start: 42,
  },
  {
    artist: 'Валерий Меладзе',
    name: 'Притяжения больше нет',
    rus: true,
    id: 'b7G5twVZVHM',
    start: 78,
  },
  {
    artist: 'Верка сердючка',
    name: 'Всё будет хорошо',
    rus: true,
    id: 'k5ZRVPp8R0Q',
    start: 31,
  },
  {
    artist: 'Винтаж',
    name: 'Плохая девочка',
    rus: true,
    id: '49UpAFMhmP0',
    start: 54,
  },
  {
    artist: 'Глюк’oZa',
    name: 'Невеста',
    rus: true,
    id: 'SzlGR9ValNc',
    start: 72,
  },
  {
    artist: 'Город 312',
    name: 'Вне зоны доступа',
    rus: true,
    id: '32kBLclkumI',
    start: 45,
  },
  {
    artist: 'Город 312',
    name: 'Останусь',
    rus: true,
    id: 'PVcILgD1qBo',
    start: 50,
  },
  { artist: 'Градусы', name: 'Голая', rus: true, id: 'd8G7_Cxl-_I', start: 57 },
  {
    artist: 'Грибы',
    name: 'Тает Лёд',
    rus: true,
    id: 'Ig2veaeITEA',
    start: 128,
  },
  { artist: 'ДДТ', name: 'Это все', rus: true, id: '6PK_FuShTOs', start: 231 },
  { artist: 'ДЕМО', name: 'Солнышко', rus: true, id: 'hKXDDpoqvnI', start: 65 },
  {
    artist: 'Децл',
    name: 'Вечеринка',
    rus: true,
    id: 'NU-XAxBkEaE',
    start: 76,
  },
  {
    artist: 'Дима Билан',
    name: 'Невозможное возможно',
    rus: true,
    id: 'C_hsGFpA1ik',
    start: 49,
  },
  {
    artist: 'Дискотека Авария',
    name: 'Если хочешь остаться',
    rus: true,
    id: 'qN9ylHPY6fQ',
    start: 26,
  },
  {
    artist: 'Дискотека Авария',
    name: 'Пей пиво',
    rus: true,
    id: 'UBLcsAnGzJQ',
    start: 67,
  },
  { artist: 'Ёлка', name: 'Прованс', rus: true, id: 'oXb6jg3OTG0', start: 54 },
  {
    artist: 'Жанна Фриске',
    name: 'Ла-ла-ла',
    rus: true,
    id: 'ebPdskNpzQI',
    start: 45,
  },
  {
    artist: 'Женя Отрадная',
    name: 'Уходи и дверь закрой',
    rus: true,
    id: 'H1F0EDwID28',
    start: 37,
  },
  {
    artist: 'Жуки',
    name: 'Батарейка',
    rus: true,
    id: 'hhpIU5U2N24',
    start: 71,
  },
  {
    artist: 'Звери',
    name: 'Районы-кварталы',
    rus: true,
    id: 'CqZJ1aT1eYY',
    start: 39,
  },
  {
    artist: 'Звери',
    name: 'До скорой встречи',
    rus: true,
    id: 'NqAp7l82UaI',
    start: 84,
  },
  {
    artist: 'Звери',
    name: 'Дожди-пистолеты',
    rus: true,
    id: 'CTQxNgCejVg',
    start: 62,
  },
  {
    artist: 'Земфира',
    name: 'Бесконечность ',
    rus: true,
    id: 'Fxj4gAZkB0k',
    start: 104,
  },
  {
    artist: 'Земфира',
    name: 'Ромашки',
    rus: true,
    id: 'qKuTh2xmGWg',
    start: 47,
  },
  {
    artist: 'Земфира',
    name: 'Искала',
    rus: true,
    id: 'imCUXkbjhzU',
    start: 36,
  },
  {
    artist: 'Иван Дорн',
    name: 'Стыцамэн',
    rus: true,
    id: 'YwGOfyg77Uk',
    start: 123,
  },
  {
    artist: 'Иванушки Int.',
    name: 'Тополиный пух',
    rus: true,
    id: 'wpk3Iwo0Kr0',
    start: 114,
  },
  {
    artist: 'Иракли',
    name: 'Лондон Париж',
    rus: true,
    id: 'jCmOPKJX8wA',
    start: 57,
  },
  {
    artist: 'Ирина Аллегрова',
    name: 'Младший лейтенант',
    rus: true,
    id: 'jjhn8-U9Kl8',
    start: 127,
  },
  {
    artist: 'Ирина Аллегрова',
    name: 'Угонщица',
    rus: true,
    id: 'qN1JUvS2kqo',
    start: 56,
  },
  {
    artist: 'Каста',
    name: 'Вокруг шум',
    rus: true,
    id: 'avq3kIvqn-o',
    start: 51,
  },
  {
    artist: 'Каста',
    name: 'Сочиняй мечты',
    rus: true,
    id: 'GpV0hvsKmUQ',
    start: 140,
  },
  {
    artist: 'Катя Лель',
    name: 'Мой Мармеладный',
    rus: true,
    id: '18jjqM4-OFg',
    start: 59,
  },
  {
    artist: 'Кипелов',
    name: 'Я свободен',
    rus: true,
    id: '44rsGyOANgw',
    start: 132,
  },
  {
    artist: 'Корни',
    name: 'С днем рождения Вика',
    rus: true,
    id: '-0TCsm-O45Y',
    start: 42,
  },
  {
    artist: 'Король и Шут',
    name: 'Кукла колдуна',
    rus: true,
    id: 'sbSWDBk5Z7g',
    start: 48,
  },
  {
    artist: 'Король и Шут',
    name: 'Прыгну со скалы',
    rus: true,
    id: 'fd0miVbzU30',
    start: 19,
  },
  {
    artist: 'ЛЕПРИКОНСЫ',
    name: 'Хали-гали, паратрупер',
    rus: true,
    id: 'guRv3iguxkk',
    start: 135,
  },
  {
    artist: 'Леонид Агутин',
    name: 'Остров',
    rus: true,
    id: 'ePa2g0Igsr8',
    start: 74,
  },
  {
    artist: 'Леонид Агутин',
    name: 'Хоп Хей Лала-Лей',
    rus: true,
    id: 'g-uZMyGg71A',
    start: 120,
  },
  {
    artist: 'Лолита',
    name: 'На Титанике',
    rus: true,
    id: 'y8lRv_aLL3I',
    start: 83,
  },
  {
    artist: 'МакSим',
    name: 'Вертром стать',
    rus: true,
    id: 'kBs40FFOZrE',
    start: 116,
  },
  {
    artist: 'МакSим',
    name: 'Знаешь ли ты',
    rus: true,
    id: '_v8fXKA5DI8',
    start: 142,
  },
  {
    artist: 'Макс Корж',
    name: 'Жить в кайф',
    rus: true,
    id: 'OQhuqA6UhmE',
    start: 44,
  },
  {
    artist: 'Мария Ржевская',
    name: 'Когда я стану кошкой',
    rus: true,
    id: 'UZ9ac7vb8-E',
    start: 50,
  },
  {
    artist: 'Михей и Джуманджи',
    name: 'Сука-любовь',
    rus: true,
    id: 'M4UtiYaOjmg',
    start: 99,
  },
  {
    artist: 'Многоточие',
    name: 'В жизни так бывает',
    rus: true,
    id: 'KVvZjwX35wI',
    start: 993,
  },
  {
    artist: 'Монеточка',
    name: 'Каждый раз',
    rus: true,
    id: 'pNSoGfaWx6o',
    start: 66,
  },
  {
    artist: 'Мумий Тролль',
    name: 'Невеста',
    rus: true,
    id: 'YjCOZvoFiTc',
    start: 112,
  },
  {
    artist: 'Мумий Тролль',
    name: 'Владивосток 2000',
    rus: true,
    id: 'rD2J_ocb3cU',
    start: 33,
  },
  {
    artist: 'Мумий Тролль',
    name: 'Утекай',
    rus: true,
    id: 'Ok1-XYV3k60',
    start: 26,
  },
  {
    artist: 'Натали',
    name: 'О боже, какой мужчина!',
    rus: true,
    id: 'vfVIxW7DUYI',
    start: 40,
  },
  {
    artist: 'Ноль',
    name: 'Человек и кошка',
    rus: true,
    id: 'wQffLMBdIwU',
    start: 40,
  },
  {
    artist: 'Нюша',
    name: 'Выбирать чудо',
    rus: true,
    id: 'M5_61X320os',
    start: 38,
  },
  {
    artist: 'Отпетые Мошенники',
    name: 'Девушки бывают разные',
    rus: true,
    id: 'W8IRmYdgUXg',
    start: 58,
  },
  {
    artist: 'Отпетые Мошенники',
    name: 'Люби меня, люби',
    rus: true,
    id: '0NK2sKZljcY',
    start: 94,
  },
  {
    artist: 'ПОРНОФИЛЬМЫ',
    name: 'Я так соскучился',
    rus: true,
    id: '8U_MiEAjhDc',
    start: 74,
  },
  {
    artist: 'Рок-Острова',
    name: 'Ничего не говори',
    rus: true,
    id: 'dijcAFMkgk0',
    start: 80,
  },
  {
    artist: 'Руки Вверх!',
    name: 'Крошка моя',
    rus: true,
    id: 'xno9GOi3FaI',
    start: 123,
  },
  {
    artist: 'Руки Вверх!',
    name: 'Чужие Губы',
    rus: true,
    id: '60w93RcyKeg',
    start: 55,
  },
  {
    artist: 'Руки Вверх!',
    name: 'Алёшка',
    rus: true,
    id: 'oz0NAYehGc0',
    start: 52,
  },
  {
    artist: 'Руки Вверх!',
    name: '18 мне уже',
    rus: true,
    id: 't_la20ZBpCQ',
    start: 62,
  },
  {
    artist: 'Сплин',
    name: 'Выхода нет',
    rus: true,
    id: 'XakXGfd07hk',
    start: 40,
  },
  {
    artist: 'Сплин',
    name: 'Орбит без сахара',
    rus: true,
    id: 'N1wBJkkjzW0',
    start: 25,
  },
  {
    artist: 'Султан Лагучев',
    name: 'Горький вкус',
    rus: true,
    id: 'v5DBulc5nA0',
    start: 29,
  },
  {
    artist: 'ТаТу',
    name: 'Нас не догонят',
    rus: true,
    id: 'vd_-qkJdGfw',
    start: 76,
  },
  {
    artist: 'ТаТу',
    name: 'Я сошла с ума',
    rus: true,
    id: 'NbRAH7xTXHg',
    start: 55,
  },
  {
    artist: 'Танцы Минус',
    name: 'Город',
    rus: true,
    id: 'nKpFuiANJyQ',
    start: 47,
  },
  {
    artist: 'Трофимов',
    name: 'Поезда',
    rus: true,
    id: 'qEelwwLmX38',
    start: 57,
  },
  {
    artist: 'Ундервуд',
    name: 'Гагарин, я вас любила',
    rus: true,
    id: 'ZQxqQ6-3yAE',
    start: 41,
  },
  {
    artist: 'ФАБРИКА',
    name: 'Про любовь',
    rus: true,
    id: 'TS7gm1GPwNI',
    start: 26,
  },
  {
    artist: 'Фактор 2',
    name: 'Красавица',
    rus: true,
    id: '0uGEVMd2pyE',
    start: 41,
  },
  {
    artist: 'Элджей & Feduk',
    name: 'Розовое вино',
    rus: true,
    id: 'LKTalcjnE2U',
    start: 19,
  },
  {
    artist: 'Юлия Савичева',
    name: 'Если в сердце живёт любовь',
    rus: true,
    id: 'JjyiuU5T2ag',
    start: 90,
  },
  {
    artist: 'Юлия Савичева',
    name: 'Привет',
    rus: true,
    id: 'e5VyPAx7-cw',
    start: 115,
  },
];

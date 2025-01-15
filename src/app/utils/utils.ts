import { IVideo } from "../models/models";

export function extractVideoId(url: string): string | null {
  const pattern = /youtu\.be\/([\w-]+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

export function extractTimestamp(url: string): number | null {
  const pattern = /\?t=(\d+)/;
  const match = url.match(pattern);
  return match ? parseInt(match[1], 10) : null;
}

export function getMusician(song: IVideo){
  return song.name.split(';')[0];
}

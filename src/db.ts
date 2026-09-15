import Dexie, { type Table } from 'dexie';

export interface PlayerStat {
  id: number;
  type: 'hp' | 'num';
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export interface Player {
  id: number;
  name: string;
  note?: string;
  stats: PlayerStat[];
}

export interface GameSave {
  id: string;
  name: string;
  scenario?: string;
  color: string;
  hasPhoto: boolean;
  photo?: string; // Compressed Base64 image
  lastModified: number;
  next: string;
  round: number;
  npid?: number | null;
  players: Player[];
  cl: string[]; // Checklist items
}

export class PackAwayDatabase extends Dexie {
  saves!: Table<GameSave>;

  constructor() {
    super('PackAwayDB');
    this.version(1).stores({
      saves: 'id, name, lastModified'
    });
  }
}

export const db = new PackAwayDatabase();

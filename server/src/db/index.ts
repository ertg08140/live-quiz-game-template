import { Game, User } from '../types';

export const USERS_DB: User[] = [];

export type GameDb = Omit<Game, 'hostId' | 'playerAnswers'> & { host: User };
export const GAMES_DB: GameDb[] = [];
// export const GAMES_DB = new Map<
//   string,
//   { gameId: string; code: string; players: User[]; host: User }
// >();

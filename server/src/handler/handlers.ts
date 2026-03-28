import { WebSocket } from 'ws';
import { loginHandler } from './loginHandler';
import { WSMessage } from '../types';
import { createGameHandler, joinGameHandler } from './gameManagmentHandler';
import { questionAnswerHandler, startGameHandler } from './gamePlayHandler';

export const handlers = {
  reg: (ws: WebSocket, data: WSMessage['data']) => {
    console.log('reg:', data);
    return loginHandler(ws, data);
  },
  create_game: (ws: WebSocket, data: WSMessage['data']) => {
    console.log('create_game:', data);
    return createGameHandler(ws, data);
  },
  join_game: (ws: WebSocket, data: WSMessage['data']) => {
    console.log('join_game', data);
    return joinGameHandler(ws, data);
  },
  start_game: (ws: WebSocket, data: WSMessage['data']) => {
    console.log('start_game', data);
    return startGameHandler(ws, data);
  },
  answer: (ws: WebSocket, data: WSMessage['data']) => {
    console.log('answer', data);
    return questionAnswerHandler(ws, data);
  },
};

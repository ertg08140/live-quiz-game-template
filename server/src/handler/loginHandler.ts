import { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { WSMessage } from '../types';
import { USERS_DB } from '../db';

export const loginHandler = (ws: WebSocket, data: WSMessage['data']) => {
  console.log('data', data);
  const { name, password } = data;

  if (!name || !password) {
    ws.send(
      JSON.stringify({
        type: 'reg',
        data: {
          name: '',
          index: '',
          error: true,
          errorText: 'No user or password',
        },
        id: 0,
      }),
    );
    return;
  }

  const user = { index: randomUUID(), name, password, ws };
  USERS_DB.push(user);

  ws.send(
    JSON.stringify({
      type: 'reg',
      data: {
        name,
        index: user.index,
        error: false,
        errorText: '',
      },
      id: 0,
    }),
  );
};

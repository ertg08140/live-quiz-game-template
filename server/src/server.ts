import { Server, WebSocket } from 'ws';
import { transformDataToMessage } from './utils/transformDataToMessage';
import { handlers } from './handler/handlers';
import { WSMessage } from './types';
import { exitHandler } from './handler/exitHandler';

export const startWsServer = (wss: Server) => {
  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (data: Buffer) => {
      const message: WSMessage = transformDataToMessage(data);

      try {
        const handler = handlers[message.type as keyof typeof handlers];

        if (handler) {
          handler(ws, message.data);
        } else {
          ws.send(JSON.stringify({ error: 'Unknown message type' }));
        }
      } catch (err) {
        console.error('Error', err);
      }
    });

    ws.on('close', () => {
      exitHandler(ws);
    });
  });
};

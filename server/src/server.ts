import { Server, WebSocket } from 'ws';
import { transformDataToMessage } from './utils/transformDataToMessage';
import { handlers } from './handler/handlers';
import { WSMessage } from './types';

export const startWsServer = (wss: Server) => {
  wss.on('connection', (ws: WebSocket) => {
    console.log('Клиент подключен');

    ws.on('message', (data: Buffer) => {
      // В ws сообщения приходят в виде Buffer, переводим в строку
      const message: WSMessage = transformDataToMessage(data);

      try {
        // Ищем обработчик по типу
        const handler = handlers[message.type];

        if (handler) {
          handler(ws, message.data, wss);
        } else {
          console.warn(`Неизвестный тип сообщения: ${message.type}`);
          ws.send(JSON.stringify({ error: 'Unknown message type' }));
        }
      } catch (err) {
        console.error('Ошибка парсинга:', err);
      }
    });

    ws.on('close', () => console.log('Клиент отключился'));
  });
};

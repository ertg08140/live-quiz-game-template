import { GameDb } from '../db';

export const broadcastMessage = (game: GameDb, data: String) => {
  game.players.forEach((user) => {
    if (user.ws?.readyState === WebSocket.OPEN) {
      user.ws.send(data);
    }
  });

  if (game.host.ws?.readyState === WebSocket.OPEN) {
    game.host.ws.send(data);
  }
};

import { WebSocket } from 'ws';
import { GameDb, GAMES_DB, USERS_DB } from '../db';

export const exitHandler = (ws: WebSocket) => {
  const userIndex = USERS_DB.findIndex((user) => user.ws === ws);

  if (userIndex !== -1) {
    USERS_DB.splice(userIndex, 1);
  }

  let playingGame: GameDb | null = null;
  for (const game of GAMES_DB) {
    const index = game.players.findIndex((player) => player.ws === ws);

    if (index !== -1) {
      game.players.splice(index, 1);
      playingGame = game;
    }
  }

  if (playingGame) {
    console.log('player disconnected');
    const playersData = playingGame.players.map((player) => ({
      name: player.name,
      index: player.index,
      score: 0,
    }));
    const updatePlayers = JSON.stringify({
      type: 'update_players',
      data: playersData,
      id: 0,
    });

    playingGame.players.forEach((player) => {
      if (player.ws?.readyState === WebSocket.OPEN) {
        player.ws.send(updatePlayers);
      }
    });

    if (playingGame.host.ws?.readyState === WebSocket.OPEN) {
      playingGame.host.ws.send(updatePlayers);
    }
  }
};

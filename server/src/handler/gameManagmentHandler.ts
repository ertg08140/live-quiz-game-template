import { WebSocket } from 'ws';
import { WSMessage } from '../types';
import { randomUUID, randomBytes } from 'node:crypto';
import { GAMES_DB, USERS_DB } from '../db';

export const createGameHandler = (ws: WebSocket, data: WSMessage['data']) => {
  const { questions } = data;
  const user = USERS_DB.find((user) => user.ws === ws);
  if (!questions?.length || !user) {
    ws.send(
      JSON.stringify({
        type: 'create_game',
        data: {
          name: '',
          index: '',
          error: true,
          errorText: 'Incorrect questions',
        },
        id: 0,
      }),
    );
    return;
  }

  const game = {
    id: randomUUID(),
    code: randomBytes(3).toString('hex').toLocaleUpperCase(),
    players: [],
    host: user,
    questions,
    currentQuestion: 0,
    status: 'waiting' as const,
  };

  GAMES_DB.push(game);

  ws.send(
    JSON.stringify({
      type: 'game_created',
      data: {
        gameId: game.id,
        code: game.code,
      },
      id: 0,
    }),
  );
};

export const joinGameHandler = (ws: WebSocket, data: WSMessage['data']) => {
  const { code } = data;

  const game = GAMES_DB.find((game) => game.code === code);
  console.log('game', game);
  const user = USERS_DB.find((user) => user.ws === ws);
  const isPlayerExist =
    game?.players.findIndex((player) => player.ws === ws) !== -1;

  if (!game || !user || isPlayerExist) {
    ws.send(
      JSON.stringify({
        type: 'join_game',
        data: {
          name: '',
          index: '',
          error: true,
          errorText: 'Incorrect game code',
        },
        id: 0,
      }),
    );
    return;
  }
  game?.players.push({ ...user, score: 0 });
  ws.send(
    JSON.stringify({
      type: 'game_joined',
      data: {
        gameId: game.id,
      },
      id: 0,
    }),
  );
  game.players.forEach((user) => {
    if (user.ws?.readyState === WebSocket.OPEN) {
      user.ws.send(
        JSON.stringify({
          type: 'player_joined',
          data: {
            playerName: user.name,
            playerCount: game.players.length,
          },
          id: 0,
        }),
      );
    }
  });

  const playersData = game.players.map((player) => ({
    name: player.name,
    index: player.index,
    score: 0,
  }));
  const updatePlayers = JSON.stringify({
    type: 'update_players',
    data: playersData,
    id: 0,
  });

  game.players.forEach((user) => {
    if (user.ws?.readyState === WebSocket.OPEN) {
      user.ws.send(updatePlayers);
    }
  });

  if (game.host.ws?.readyState === WebSocket.OPEN) {
    game.host.ws.send(updatePlayers);
  }
};

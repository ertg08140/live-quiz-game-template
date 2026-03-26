import { WebSocket } from 'ws';
import { WSMessage } from '../types';
import { GAMES_DB } from '../db';

export const startGameHandler = (ws: WebSocket, data: WSMessage['data']) => {
  const { gameId } = data;
  const game = GAMES_DB.find((game) => game.id === gameId);
  if (!game) {
    ws.send(
      JSON.stringify({
        type: 'start_game',
        data: {
          name: '',
          index: '',
          error: true,
          errorText: 'Operation filed',
        },
        id: 0,
      }),
    );
    return;
  }

  const { currentQuestion, questions } = game;

  const startGameAnswer = JSON.stringify({
    type: 'question',
    data: {
      questionNumber: currentQuestion + 1,
      totalQuestions: questions.length,
      text: questions[currentQuestion].text,
      options: questions[currentQuestion].options,
      timeLimitSec: questions[currentQuestion].timeLimitSec,
    },
    id: 0,
  });

  game.players.forEach((player) => player.ws?.send(startGameAnswer));

  if (game.host.ws?.readyState === WebSocket.OPEN) {
    game.host.ws.send(startGameAnswer);
  }
  game.currentQuestion += 1;
};

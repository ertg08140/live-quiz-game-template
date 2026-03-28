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
  game.status = 'in_progress';
};

export const questionAnswerHandler = (
  ws: WebSocket,
  data: WSMessage['data'],
) => {
  const { gameId, questionIndex, answerIndex } = data;
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

  const isCorrectAnswer =
    game.questions[questionIndex].correctIndex === answerIndex;

  const player = game.players.find((player) => player.ws === ws);
  if (player) {
    player.hasAnswered = true;
    player.answeredCorrectly = isCorrectAnswer;
    player.score = isCorrectAnswer ? (player.score += 1) : player.score;
  }

  ws.send(
    JSON.stringify({
      type: 'answer_accepted',
      data: {
        questionIndex,
      },
      id: 0,
    }),
  );
  const isAllPlayersAnswered = game.players.every(
    (player) => player.hasAnswered === true,
  );
  console.log('isAllPlayersAnswered', isAllPlayersAnswered);

  if (isAllPlayersAnswered) {
    const playersResults = game.players.map((player) => {
      return {
        name: player.name,
        answered: player.hasAnswered,
        correct: player.answeredCorrectly,
        pointsEarned: 1,
        totalScore: player.score,
      };
    });

    const questionResult = JSON.stringify({
      type: 'question_result',
      data: {
        questionIndex: questionIndex,
        correctIndex: game.questions[questionIndex].correctIndex,
        playerResults: playersResults,
      },
      id: 0,
    });
    game.players.forEach((user) => {
      if (user.ws?.readyState === WebSocket.OPEN) {
        user.ws.send(questionResult);
      }
    });

    if (game.host.ws?.readyState === WebSocket.OPEN) {
      game.host.ws.send(questionResult);
    }

    const { currentQuestion, questions, players, host } = game;
    if (currentQuestion < questions.length) {
      const question = JSON.stringify({
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

      players.forEach((player) => player.ws?.send(question));

      if (host.ws?.readyState === WebSocket.OPEN) {
        host.ws.send(question);
      }
      console.log('current question:', game.currentQuestion);
      console.log('questions.length:', questions.length);
      game.currentQuestion += 1;
      game.players.forEach((player) => {
        player.hasAnswered = false;
        player.answeredCorrectly = false;
      });
    } else {
      console.log('finish');
      const playersScore = game.players.map((player) => {
        return {
          name: player.name,
          score: player.score,
          rank: 1,
        };
      });
      const gameFinished = JSON.stringify({
        type: 'game_finished',
        data: {
          scoreboard: playersScore,
        },
        id: 0,
      });

      game.players.forEach((player) => player.ws?.send(gameFinished));

      if (game.host.ws?.readyState === WebSocket.OPEN) {
        game.host.ws.send(gameFinished);
      }
    }
  }
};

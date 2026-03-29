import { WebSocket } from 'ws';
import { WSMessage } from '../types';
import { GAMES_DB } from '../db';
import { broadcastMessage } from '../utils/broadcastMessage';

const BASE_POINTS = 1000;

const gameTimers = new Map<string, NodeJS.Timeout>();

const questionStartTimes = new Map<string, number>();

const handleQuestionTimeout = (gameId: string) => {
  const game = GAMES_DB.find((game) => game.id === gameId);
  if (!game) return;

  const questionIndex = game.currentQuestion - 1;
  const timeLimit = game.questions[questionIndex].timeLimitSec;

  const playersResults = game.players.map((player) => {
    let pointsEarned = 0;

    if (player.hasAnswered && player.answeredCorrectly) {
      const questionStartTime = questionStartTimes.get(gameId) || Date.now();
      const elapsedTime = (Date.now() - questionStartTime) / 1000;
      const timeRemaining = Math.max(0, timeLimit - elapsedTime);
      pointsEarned = Math.round(BASE_POINTS * (timeRemaining / timeLimit));
      player.score += pointsEarned;
    }

    return {
      name: player.name,
      answered: player.hasAnswered,
      correct: player.answeredCorrectly,
      pointsEarned,
      totalScore: player.score,
    };
  });
  const { currentQuestion, questions } = game;
  const questionResult = JSON.stringify({
    type: 'question_result',
    data: {
      questionIndex,
      correctIndex: game.questions[questionIndex].correctIndex,
      playerResults: playersResults,
    },
    id: 0,
  });

  broadcastMessage(game, questionResult);

  game.players.forEach((player) => {
    player.hasAnswered = false;
    player.answeredCorrectly = false;
  });

  if (currentQuestion < questions.length) {
    const nextQuestion = JSON.stringify({
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
    broadcastMessage(game, nextQuestion);

    game.currentQuestion += 1;

    questionStartTimes.set(gameId, Date.now());
    const nextTimeLimitMs = questions[currentQuestion].timeLimitSec * 1000;
    const nextTimer = setTimeout(() => {
      handleQuestionTimeout(gameId);
    }, nextTimeLimitMs);

    gameTimers.set(gameId, nextTimer);
  } else {
    game.status = 'finished';
    const playersScore = game.players
      .sort((a, b) => b.score - a.score)
      .map((player, index) => {
        return {
          name: player.name,
          score: player.score,
          rank: index + 1,
        };
      });

    const gameFinished = JSON.stringify({
      type: 'game_finished',
      data: {
        scoreboard: playersScore,
      },
      id: 0,
    });
    broadcastMessage(game, gameFinished);
    gameTimers.delete(gameId);
    questionStartTimes.delete(gameId);
  }
};

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

  broadcastMessage(game, startGameAnswer);

  game.currentQuestion += 1;
  game.status = 'in_progress';

  questionStartTimes.set(gameId, Date.now());
  const timeLimitMs = questions[currentQuestion].timeLimitSec * 1000;

  const timer = setTimeout(() => {
    handleQuestionTimeout(gameId);
  }, timeLimitMs);

  gameTimers.set(gameId, timer);
};

export const questionAnswerHandler = (
  ws: WebSocket,
  data: WSMessage['data'],
) => {
  const { gameId, questionIndex, answerIndex } = data;
  const game = GAMES_DB.find((game) => game.id === gameId);
  if (!game) {
    return;
  }

  const isCorrectAnswer =
    game.questions[questionIndex].correctIndex === answerIndex;

  const player = game.players.find((player) => player.ws === ws);
  if (player) {
    player.hasAnswered = true;
    player.answeredCorrectly = isCorrectAnswer;
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

  if (isAllPlayersAnswered) {
    const existingTimer = gameTimers.get(gameId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      gameTimers.delete(gameId);
    }

    handleQuestionTimeout(gameId);
  }
};

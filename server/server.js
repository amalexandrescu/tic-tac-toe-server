const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const gameState = {
  board: Array(9).fill(null),
  players: [],
  currentTurn: null, //the id of the player
  status: "waiting", //it can be waiting, playing, finished
  winner: null,
};

app.get("/state", (req, res) => {
  res.json(gameState);
});

app.post("/register", (req, res) => {
  const { name } = req.body;

  if (gameState.players.length >= 2) {
    return res.status(400).json({ error: "Already 2 players in the game" });
  }

  const playerId = gameState.players.length;
  const playerMoveSymbol = gameState.players.length === 0 ? "X" : "0";
  gameState.players.push({ id: playerId, name, playerMoveSymbol });

  if (gameState.players.length === 2) {
    gameState.status = "playing";
    gameState.currentTurn = 0;
  }

  res.json({ playerId });
});

const winningPatters = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const checkWinner = (symbol) => {
  return winningPatters.some((pattern) =>
    pattern.every((el) => gameState.board[el] === symbol)
  );
};

app.post("/move", (req, res) => {
  const { playerId, cellIndex } = req.body;

  if (gameState.status !== "playing") {
    return res.status(400).json({ error: "Game not started" });
  }

  if (gameState.currentTurn !== playerId) {
    return res.status(403).json({ error: "Not your turn" });
  }

  if (gameState.board[cellIndex] !== null) {
    return res.status(400).json({ error: "Cell not available" });
  }

  const numericId = parseInt(playerId);
  const playerSymbol = numericId === 0 ? "X" : "0";
  gameState.board[cellIndex] = playerSymbol;

  if (checkWinner(playerSymbol)) {
    gameState.status = "finished";
    const winner = gameState.players.find(
      (player) => player.playerMoveSymbol === playerSymbol
    );
    gameState.winner = winner;
  } else if (gameState.board.every((cell) => cell !== null)) {
    gameState.status = "finished";
    gameState.winner = "Draw";
  } else {
    gameState.currentTurn = 1 - gameState.currentTurn;
  }

  res.json({ success: true, gameState });
});

app.post("/reset", (req, res) => {
  gameState.board = Array(9).fill(null);
  gameState.currentTurn = 0;
  gameState.status = gameState.players.length === 2 ? "playing" : "waiting";
  gameState.winner = null;

  res.json({ success: true });
});

app.post("/exit", (req, res) => {
  gameState.board = Array(9).fill(null);
  gameState.players = [];
  gameState.currentTurn = null;
  gameState.status = "waiting"; //it can be waiting, playing, finished
  gameState.winner = null;

  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`server running on port: ${port}`);
});

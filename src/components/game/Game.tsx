import { useState } from "react";

import { GameBoard } from "./GameBoard";

export function Game() {
  // Initial empty 3x3 board
  const [board, setBoard] = useState<(string | null)[][]>([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);
  const [xIsNext, setXIsNext] = useState(true);

  // Utility: check for a win
  function calculateWinner(b: (string | null)[][]): string | null {
    const lines = [
      [[0, 0],[0, 1],[0, 2]],
      [[1, 0],[1, 1],[1, 2]],
      [[2, 0],[2, 1],[2, 2]],
      [[0, 0],[1, 0],[2, 0]],
      [[0, 1],[1, 1],[2, 1]],
      [[0, 2],[1, 2],[2, 2]],
      [[0, 0],[1, 1],[2, 2]],
      [[0, 2],[1, 1],[2, 0]],
    ];
    for (const [a, b2, c] of lines) {
      const [x1,y1]=a, [x2,y2]=b2, [x3,y3]=c;
      const v = b[x1][y1];
      if (v && v === b[x2][y2] && v === b[x3][y3]) {
        return v;
      }
    }
    return null;
  }

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(row => row.every(cell => cell !== null));
  const gameOver = !!winner || isDraw;

  // Handle a cell click
  function handleCellClick(row: number, col: number) {
    if (gameOver || board[row][col]) return;
    const mark = xIsNext ? "X" : "O";
    const newBoard = board.map((r, i) =>
      r.map((c, j) => (i === row && j === col ? mark : c))
    );
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  }

  return (
    <>
      <GameBoard
        board={board}
        isMyTurn={!gameOver}
        onCellClick={handleCellClick}
        gameOver={gameOver}
      />
    </>
  );
}

"use client";

import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface GameBoardProps {
  board: (string | null)[][];
  isMyTurn: boolean;
  onCellClick: (row: number, col: number) => void;
  gameOver: boolean;        // new prop
}

export function GameBoard({
  board,
  isMyTurn,
  onCellClick,
  gameOver,                // pull it in
}: GameBoardProps) {
  return (
    <div className="w-full max-w-xs mx-auto">
      <Card className="bg-muted/20 p-4">
        <div className="grid grid-cols-3 gap-2">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <Button
                key={`${rowIndex}-${colIndex}`}
                variant={cell ? "default" : "outline"}
                size="lg"
                className="h-20 text-3xl font-bold"
                disabled={
                  !isMyTurn ||
                  cell !== null ||
                  gameOver           // disable if game over
                }
                onClick={() => onCellClick(rowIndex, colIndex)}
              >
                {cell || ""}
              </Button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

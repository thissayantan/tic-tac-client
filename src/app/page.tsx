"use client";
import { useEffect, useState } from "react";
import { GameBoard } from "@/components/game/GameBoard";
import { GameStatus } from "@/components/game/GameStatus";
import { RoomJoin } from "@/components/game/RoomJoin";
import { WinnerCelebration } from "@/components/game/WinnerCelebration";
import { useGameStore } from "@/lib/store";
import { useSocketService } from "@/lib/socket-service";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [playerAvatar, setPlayerAvatar] = useState("globe");

  const {
    connected,
    connectionError,
    roomId,
    playerName,
    playerSymbol,
    opponentName,
    opponentAvatar,
    board,
    currentTurn,
    gameStatus,
    resetGame,
    winnerName
  } = useGameStore();

  const { initializeSocket, createRoom, joinRoom, playerMove, restartGame, cleanup, disconnect } = useSocketService();
  const router = useRouter();

  // establish socket once
  useEffect(() => {
    initializeSocket();
    return () => cleanup();
  }, []);

  // deep-link room code
  useEffect(() => {
    if (roomId) window.history.replaceState(null, '', `/?room=${roomId}`);
  }, [roomId]);

  const handleCreateRoom = (name: string, avatar: string) => {
    setIsLoading(true);
    setPlayerAvatar(avatar);
    createRoom(name, avatar);
  };

  const handleJoinRoom = (code: string, name: string, avatar: string) => {
    setIsLoading(true);
    setPlayerAvatar(avatar);
    joinRoom(code, name, avatar);
  };

  const handleCellClick = (r: number, c: number) => playerMove(r, c);
  const handlePlayAgain = () => restartGame();

  const isPlaying = gameStatus === 'playing';
  const isEnd = ['won', 'lost', 'draw'].includes(gameStatus);

  if (connectionError) return (
    <div className="text-center p-8 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-red-500 mb-4">Connection Error</h2>
      <p className="mb-4">{connectionError}</p>
      <Button onClick={() => window.location.reload()}>Retry</Button>
    </div>
  );

  if (!connected) return <div className="text-center p-8">Connecting...</div>;

  if (gameStatus === 'lobby') {
    return (
      <RoomJoin
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        isLoading={isLoading}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row items-start gap-6">
        <GameBoard
          board={board}
          isMyTurn={isPlaying && currentTurn === playerSymbol}
          onCellClick={handleCellClick}
          gameOver={!isPlaying}
        />
        <GameStatus
          currentPlayer={currentTurn === playerSymbol ? "Your turn" : "Opponent's turn"}
          playerSymbol={playerSymbol || '-'}
          playerAvatar={playerAvatar}
          opponentName={opponentName || undefined}
          opponentAvatar={opponentAvatar || undefined}
          gameStatus={gameStatus}
          roomCode={roomId || undefined}
        />
      </div>

      {/* End-game overlay */}
      {isEnd && (
        <>
          <WinnerCelebration isVisible={gameStatus === 'won'} />
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-black rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">
                {gameStatus === 'draw'
                  ? "It's a Draw!"
                  : winnerName
                  ? `Winner: ${winnerName}`
                  : ''}
              </h2>
              <p className="mb-4 text-lg">
                {gameStatus === 'draw'
                  ? 'No more moves.'
                  : winnerName
                  ? `Congratulations, ${winnerName}!`
                  : ''}
              </p>
              <Button onClick={handlePlayAgain}>Play Again</Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

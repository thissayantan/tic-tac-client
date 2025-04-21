"use client";
import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';
import { GameBoard } from "@/components/game/GameBoard";
import { GameStatus } from "@/components/game/GameStatus";
import { RoomJoin } from "@/components/game/RoomJoin";
import { useGameStore } from "@/lib/store";
import { useSocketService } from "@/lib/socket-service";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [playerAvatar, setPlayerAvatar] = useState("globe");
  const [windowDim, setWindowDim] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    const update = () => setWindowDim({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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

  // Determine if current player won or lost
  const isPlaying = gameStatus === 'playing';
  const isWinner = gameStatus === 'won';
  const isLoser = gameStatus === 'lost';
  const isDraw = gameStatus === 'draw';
  const isEnd = isWinner || isLoser || isDraw;

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {isWinner && <Confetti width={windowDim.width} height={windowDim.height} recycle={false} />}
          <div className="bg-white text-black rounded-lg p-6 text-center max-w-sm mx-auto">
          {isLoser && <div className="text-9xl animate-bounce mb-4">😢</div>}
          {isWinner && <div className="text-9xl animate-bounce mb-4">🥳</div>}
            <h2 className="text-2xl font-bold mb-2">
              {isDraw
                ? "It's a Draw!"
                : isWinner
                ? `Congratulations ${playerName}`
                : 'You Lost'}
            </h2>
            <p className="mb-4 text-lg">
              {isDraw
                ? 'No more moves.'
                : isWinner
                ? 'you have won'
                : 'better luck next time.'}
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={handlePlayAgain} autoFocus>Play Again</Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  // Try window.close() first
                  const closeAttempt = window.close();
                  
                  // If window.close() doesn't work (returns undefined or false), redirect to blank page
                  if (closeAttempt === undefined || closeAttempt === false) {
                    window.location.href = "about:blank";
                    // As a fallback, try closing again after redirect
                    setTimeout(() => window.close(), 300);
                  }
                }}
              >
                Quit
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

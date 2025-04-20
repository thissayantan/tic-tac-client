"use client";

import { useEffect, useState } from "react";
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
    resetGame
  } = useGameStore();
  
  const { initializeSocket, createRoom, joinRoom, playerMove, restartGame, cleanup, disconnect } = useSocketService();
  const router = useRouter();
  
  // Initialize socket connection once on mount, cleanup on unmount
  useEffect(() => {
    initializeSocket();
    return () => cleanup();
  }, []);
  
  // Reflect roomId in URL for deep linking without reload
  useEffect(() => {
    if (roomId) {
      window.history.replaceState(null, '', `/?room=${roomId}`);
    }
  }, [roomId]);

  const handleCreateRoom = (name: string, avatarId: string) => {
    setIsLoading(true);
    setPlayerAvatar(avatarId);
    createRoom(name, avatarId);
    // Loading state will be updated when we receive the room:joined event
  };
  
  const handleJoinRoom = (roomId: string, name: string, avatarId: string) => {
    setIsLoading(true);
    setPlayerAvatar(avatarId);
    joinRoom(roomId, name, avatarId);
    // Loading state will be updated when we receive the room:joined event
  };
  
  const handleLogout = () => {
    disconnect();
    resetGame();
    // No need to redirect since we've removed the auth system
  };
  
  const handleCellClick = (row: number, col: number) => {
    playerMove(row, col);
  };
  
  const handlePlayAgain = () => {
    // Call the server to restart the game
    restartGame();
    // Local state reset will be handled by the game_restarted event handler
  };
  
  // Show error if connection failed
  if (connectionError) {
    return (
      <div className="text-center p-8 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-red-500 mb-4">Connection Error</h2>
        <p className="mb-4">{connectionError}</p>
        <Button onClick={() => window.location.reload()}>
          Retry Connection
        </Button>
      </div>
    );
  }
  
  // Show loading state during initial connection
  if (!connected && !connectionError) {
    return (
      <div className="text-center p-8">
        <p>Connecting to server...</p>
      </div>
    );
  }
  
  // Show room join UI if not in a room
  if (gameStatus === 'lobby') {
    return <RoomJoin 
      onCreateRoom={handleCreateRoom} 
      onJoinRoom={handleJoinRoom}
      isLoading={isLoading}
    />;
  }

  // Game lobby and game screen
  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto min-h-screen pt-4 px-4 relative">
      <div className="flex flex-col md:flex-row items-start gap-6 mt-12 w-full">
        <div className="flex-1 flex justify-center">
          <GameBoard 
            board={board} 
            isMyTurn={currentTurn === playerSymbol && gameStatus === 'playing'}
            onCellClick={handleCellClick} 
          />
        </div>
        
        <div className="w-full md:w-80">
          <GameStatus 
            currentPlayer={currentTurn === playerSymbol ? "Your turn" : "Opponent's turn"}
            playerSymbol={playerSymbol || '-'}
            playerAvatar={playerAvatar}
            opponentName={opponentName || undefined}
            opponentAvatar={opponentAvatar || undefined}
            gameStatus={gameStatus}
            roomCode={roomId || undefined}
          />
          
          {(gameStatus === 'won' || gameStatus === 'lost' || gameStatus === 'draw') && (
            <Button className="mt-4 w-full" onClick={handlePlayAgain}>
              Play Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

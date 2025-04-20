"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import Image from "next/image";

interface GameStatusProps {
  currentPlayer: string;
  playerSymbol: string;
  playerAvatar: string;
  opponentName?: string;
  opponentAvatar?: string;
  gameStatus: 'waiting' | 'playing' | 'won' | 'lost' | 'draw';
  roomCode?: string;
}

export function GameStatus({ 
  currentPlayer, 
  playerSymbol, 
  playerAvatar,
  opponentName, 
  opponentAvatar,
  gameStatus,
  roomCode
}: GameStatusProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'waiting':
        return 'Waiting for opponent to join...';
      case 'playing':
        return `Current turn: ${currentPlayer}`;
      case 'won':
        return 'You won!';
      case 'lost':
        return 'You lost!';
      case 'draw':
        return 'Game ended in a draw!';
      default:
        return 'Game in progress';
    }
  };
  
  const getStatusColor = () => {
    switch (gameStatus) {
      case 'waiting': return 'text-amber-500';
      case 'playing': return 'text-blue-500';
      case 'won': return 'text-green-500';
      case 'lost': return 'text-red-500';
      case 'draw': return 'text-purple-500';
      default: return 'text-blue-500';
    }
  };
  
  const shareableLink = typeof window !== 'undefined' 
    ? `${window.location.origin}?room=${roomCode}`
    : '';
  
  const copyLinkToClipboard = () => {
    if (navigator.clipboard && shareableLink) {
      navigator.clipboard.writeText(shareableLink)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Game Status</CardTitle>
          {roomCode && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsShareDialogOpen(true)}
              className="text-xs"
            >
              Share Game
            </Button>
          )}
        </div>
        {roomCode && (
          <CardDescription>
            Room Code: <span className="font-mono font-bold">{roomCode}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Players info */}
          <div className="grid grid-cols-3 gap-4">
            {/* Player */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center mb-2">
                <Image
                  src={`/avatars/${playerAvatar || 'globe'}.png`}
                  alt="Your avatar"
                  width={36}
                  height={36}
                  className="w-9 h-9"
                />
              </div>
              <div className="text-sm text-center">You</div>
              <div className="text-xl font-bold">{playerSymbol}</div>
            </div>
            
            {/* VS */}
            <div className="flex items-center justify-center">
              <div className="text-2xl font-bold text-muted-foreground">VS</div>
            </div>
            
            {/* Opponent */}
            <div className="flex flex-col items-center justify-center">
              {opponentAvatar ? (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-red-600 flex items-center justify-center mb-2">
                  <Image
                    src={`/avatars/${opponentAvatar}.png`}
                    alt="Opponent avatar"
                    width={36}
                    height={36}
                    className="w-9 h-9"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                  <span className="text-xl text-gray-400">?</span>
                </div>
              )}
              <div className="text-sm text-center">{opponentName || 'Waiting...'}</div>
              {opponentName && <div className="text-xl font-bold">{playerSymbol === 'X' ? 'O' : 'X'}</div>}
            </div>
          </div>
          
          {/* Game status message */}
          <div className={`mt-4 text-center font-semibold ${getStatusColor()}`}>
            {getStatusMessage()}
          </div>
        </div>
      </CardContent>
      
      {/* Share dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Game</DialogTitle>
            <DialogDescription>
              Share this link with a friend to invite them to join your game
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mt-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input
                id="link"
                readOnly
                value={shareableLink}
                className="font-mono text-sm"
              />
            </div>
            <Button 
              onClick={copyLinkToClipboard} 
              size="sm"
              className={copySuccess ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {copySuccess ? "Copied!" : "Copy"}
            </Button>
          </div>
          
          <DialogFooter className="sm:justify-start">
            <DialogDescription>
              Or share the room code: <span className="font-mono font-bold">{roomCode}</span>
            </DialogDescription>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

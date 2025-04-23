"use client";

import { useRef } from 'react';
import type { CellValue } from './store';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from './store';

// Define the server URL - in production, this would be your deployed server
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

// Match server-side player role constants
const PLAYER_ROLES = {
  PLAYER_X: 'PLAYER_X',
  PLAYER_O: 'PLAYER_O',
  SPECTATOR: 'SPECTATOR'
};

// Define types for socket payloads
type GameState = (string | null)[][] | { cells: (string | null)[][] };
interface GameStartedPayload {
  players: Record<string, { name?: string; avatar?: string }>;
  gameState: GameState;
  currentPlayer: string;
}
interface MoveMadePayload {
  gameState: GameState;
  nextTurn: string;
}
interface GameOverPayload {
  gameState: GameState;
  winner: string;
  draw: boolean;
}

// Define callback response types
interface RoomCallbackResponse { roomId: string; role: string; error?: string; }
interface MoveCallbackResponse { error?: string; }
// Define callback type for restart_game
interface RestartCallbackResponse { error?: string; }

// Helper to normalize gameState to CellValue[][]
const normalizeBoard = (gs: GameState): CellValue[][] => {
  const raw = Array.isArray(gs) ? gs : gs.cells;
  return raw.map(row => row.map(cell => (cell === 'X' || cell === 'O' ? cell : null)));
};

export function useSocketService() {
  const socketRef = useRef<Socket | null>(null);
  const { 
    setConnected, 
    setConnectionError, 
    setRoomInfo, 
    setPlayerInfo, 
    updateBoard, 
    updateTurn, 
    updateGameStatus,
    setWinnerName,
    playerName,
    roomId,
    makeMove
  } = useGameStore();

  // Initialize socket connection
  const initializeSocket = () => {
    if (socketRef.current) {
      console.log('Socket already initialized');
      return socketRef.current;
    }

    try {
      socketRef.current = io(SERVER_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket']
      });

      // Setup event handlers
      setupSocketListeners();

      return socketRef.current;
    } catch (error) {
      console.error('Socket initialization error:', error);
      setConnectionError('Failed to connect to the game server');
      return null;
    }
  };

  // Setup socket event listeners
  const setupSocketListeners = () => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError('Unable to connect to the game server');
    });

    // Handle game start: initialize board, turn, and update status
    socket.on('game_started', (payload: GameStartedPayload) => {
      console.log('Game started', payload);
      // Update opponent info now that game has started
      {
        const state = useGameStore.getState();
        const mySymbol = state.playerSymbol as 'X' | 'O';
        const myRole = mySymbol === 'X' ? PLAYER_ROLES.PLAYER_X : PLAYER_ROLES.PLAYER_O;
        const opponentRole = myRole === PLAYER_ROLES.PLAYER_X ? PLAYER_ROLES.PLAYER_O : PLAYER_ROLES.PLAYER_X;
        const opponent = payload.players[opponentRole];
        setPlayerInfo(mySymbol, opponent?.name || null, opponent?.avatar || null);
      }
      // Update board matrix
      const boardArr = normalizeBoard(payload.gameState);
      updateBoard(boardArr);
      // Map currentPlayer to 'X' or 'O'
      const turn = payload.currentPlayer === PLAYER_ROLES.PLAYER_X ? 'X' : 'O';
      updateTurn(turn);
      // Clear previous winner and set game status to playing
      setWinnerName(null);
      updateGameStatus('playing');
    });

    // Handle move updates and use authoritative nextTurn from server
    socket.on('move_made', (payload: MoveMadePayload) => {
      console.log('Move made received', payload);
      const boardArr = normalizeBoard(payload.gameState);
      updateBoard(boardArr);
      // Use server-provided nextTurn (role) to map to symbol
      const turnSymbol = payload.nextTurn === PLAYER_ROLES.PLAYER_X ? 'X' : 'O';
      updateTurn(turnSymbol);
    });

    socket.on('game_over', (payload: GameOverPayload) => {
      // Handle game over with proper winner mapping
      console.log('⚡️ game_over payload:', payload);
      const state = useGameStore.getState();
      // Determine own server role from symbol
      const myRole = state.playerSymbol === 'X' ? PLAYER_ROLES.PLAYER_X : PLAYER_ROLES.PLAYER_O;
      if (payload.draw) {
        setWinnerName(null);
        updateGameStatus('draw');
      } else {
        // Use actual player names for winnerName
        const winnerNameStr = payload.winner === myRole ? state.playerName : state.opponentName;
        setWinnerName(winnerNameStr || null);
        updateGameStatus(payload.winner === myRole ? 'won' : 'lost');
      }
      const boardArr = normalizeBoard(payload.gameState);
      updateBoard(boardArr);
    });

    socket.on('game_restarted', ({ board, currentPlayer }: { board: GameState; currentPlayer: string }) => {
      console.log('Game restarted');
      const boardArr = board ? normalizeBoard(board) : [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ];
      updateBoard(boardArr);
      
      // Clear winner and set game status to playing
      setWinnerName(null);
      updateGameStatus('playing');
      
      // Update turn information
      if (currentPlayer) {
        updateTurn(currentPlayer === PLAYER_ROLES.PLAYER_X ? 'X' : 'O');
      } else {
        updateTurn('X'); // Default to X starts
      }
    });

    socket.on('error', (error) => {
      console.error('Server error:', error);
      setConnectionError(`Error: ${error.message || 'Unknown error'}`);
    });
    
    // Handle server-side room errors
    socket.on('room_error', (error) => {
      console.error('Room error:', error);
      setConnectionError(`Room error: ${error.message || 'Unknown room error'}`);
    });
    
    // Handle player disconnection events
    socket.on('player_left', ({ playerName: leavingPlayer }) => {
      console.log(`Player left: ${leavingPlayer}`);
      if (leavingPlayer !== playerName) {
        // If opponent left
        setConnectionError(`${leavingPlayer} has left the game`);
      }
    });
    
    // Update opponent info when another player joins, before game start
    socket.on('player_joined', (payload: { players: Record<string, { name?: string; avatar?: string }> }) => {
      console.log('Player joined', payload);
      const state = useGameStore.getState();
      const mySymbol = state.playerSymbol as 'X' | 'O';
      const myRole = mySymbol === 'X' ? PLAYER_ROLES.PLAYER_X : PLAYER_ROLES.PLAYER_O;
      const opponentRole = myRole === PLAYER_ROLES.PLAYER_X ? PLAYER_ROLES.PLAYER_O : PLAYER_ROLES.PLAYER_X;
      const opponent = payload.players[opponentRole];
      if (opponent) {
        setPlayerInfo(mySymbol, opponent.name || null, opponent.avatar || null);
      }
    });
  };

  // Create room action
  const createRoom = (playerName: string, avatarId: string = 'globe') => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('create_room', { name: playerName, avatar: avatarId }, (response: RoomCallbackResponse) => {
      if (response.error) {
        setConnectionError(response.error);
        return;
      }
      
      console.log('Room created:', response);
      setRoomInfo(response.roomId, playerName, avatarId);
      // Set own symbol and waiting for opponent
      const createdSymbol = response.role === PLAYER_ROLES.PLAYER_X ? 'X' : 'O';
      setPlayerInfo(createdSymbol, null, null);
      // Remain in waiting state until game_started
      updateGameStatus('waiting');
    });
  };

  // Join room action - updated to match server expectations
  const joinRoom = (roomId: string, playerName: string, avatarId: string = 'globe') => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join_room', { roomId, name: playerName, avatar: avatarId }, (response: RoomCallbackResponse) => {
      if (response.error) {
        setConnectionError(response.error);
        return;
      }
      console.log('Joined room (callback):', response);
      setRoomInfo(response.roomId, playerName, avatarId);
      // Determine and store own symbol, waiting for opponent
      const symbol = response.role === PLAYER_ROLES.PLAYER_X ? 'X' : 'O';
      setPlayerInfo(symbol, null, null);
      // Set own symbol, remain waiting until game starts
      updateGameStatus('waiting');
    });
  };

  // Make a move action
  const playerMove = (row: number, col: number) => {
    const socket = socketRef.current;
    if (!socket) return;

    const moveSuccessful = makeMove(row, col);
    if (!moveSuccessful) return;
    // Remove optimistic turn flip; rely on server 'move_made' for turn updates
    socket.emit('make_move', { row, col }, (response: MoveCallbackResponse) => {
      if (response.error) {
        console.error('Move error:', response.error);
        setConnectionError(response.error);
      }
    });
  };

  // Cleanup on component unmount
  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Restart game functionality (emit with current roomId)
  const restartGame = () => {
    const socket = socketRef.current;
    if (!socket || !roomId) return;
    
    socket.emit('restart_game', { roomId }, (response: RestartCallbackResponse) => {
      if (response.error) {
        console.error('Restart error:', response.error);
        setConnectionError(response.error);
        return;
      }
      console.log('Game restarted:', response);
      // clear previous winner
      setWinnerName(null);
      // reset UI to new game state
      updateBoard([
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ]);
      updateTurn('X');
      updateGameStatus('playing');
    });
  };
  
  // Disconnect from socket server
  const disconnect = () => {
    const socket = socketRef.current;
    if (socket) {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  };

  return {
    initializeSocket,
    createRoom,
    joinRoom,
    playerMove,
    restartGame,
    cleanup,
    disconnect
  };
}

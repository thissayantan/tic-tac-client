import { useEffect, useRef } from 'react';
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
    playerName,
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
    socket.on('game_started', (payload: { players: Record<string, any>; gameState: any; currentPlayer: string }) => {
      console.log('Game started', payload);
      // Update opponent info
      const state = useGameStore.getState();
      const mySymbol = state.playerSymbol as string;
      const myRole = mySymbol === 'X' ? PLAYER_ROLES.PLAYER_X : PLAYER_ROLES.PLAYER_O;
      const opponentRole = myRole === PLAYER_ROLES.PLAYER_X ? PLAYER_ROLES.PLAYER_O : PLAYER_ROLES.PLAYER_X;
      const opponent = payload.players[opponentRole];
      setPlayerInfo(mySymbol as any, opponent?.name || null, opponent?.avatar || null);
      // Update board cells (support raw array or state.cells)
      const stateObj = payload.gameState;
      const boardArr = Array.isArray(stateObj) ? stateObj : stateObj.cells;
      updateBoard(boardArr);
      // Map currentPlayer to 'X' or 'O'
      const turn = payload.currentPlayer === PLAYER_ROLES.PLAYER_X ? 'X' : 'O';
      updateTurn(turn);
      // Set game status to playing
      updateGameStatus('playing');
    });

    // Handle move updates and use authoritative nextTurn from server
    socket.on('move_made', (payload: { gameState: any; nextTurn: string }) => {
      console.log('Move made received', payload);
      const stateArr = payload.gameState;
      const board = Array.isArray(stateArr) ? stateArr : stateArr.cells;
      updateBoard(board);
      // Use server-provided nextTurn (role) to map to symbol
      const turnSymbol = payload.nextTurn === PLAYER_ROLES.PLAYER_X ? 'X' : 'O';
      updateTurn(turnSymbol);
    });

    socket.on('game_over', (payload: { gameState: any; winner: string; draw: boolean }) => {
      console.log('Game over payload:', payload);
      // Extract board matrix (support raw array or state.cells)
      const stateObj = payload.gameState;
      const boardArr = Array.isArray(stateObj) ? stateObj : stateObj.cells;
      updateBoard(boardArr);
      // Set end-game status
      if (payload.draw) {
        updateGameStatus('draw');
      } else {
        const won = payload.winner === playerName;
        updateGameStatus(won ? 'won' : 'lost');
      }
    });
    
    socket.on('game_restarted', ({ board, currentPlayer }) => {
      console.log('Game restarted');
      updateBoard(board || [
        [null, null, null],
        [null, null, null], 
        [null, null, null]
      ]);
      
      // Reset to playing state
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
  };

  // Create room action - updated to match server expectations
  const createRoom = (playerName: string, avatarId: string = 'globe') => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('create_room', { 
      name: playerName,
      avatar: avatarId // Custom avatar ID
    }, (response: any) => {
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

    socket.emit('join_room', { 
      roomId, 
      name: playerName,
      avatar: avatarId // Custom avatar ID
    }, (response: any) => {
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

  // Make a move action - updated to match server expectations
  const playerMove = (row: number, col: number) => {
    const socket = socketRef.current;
    if (!socket) return;

    const moveSuccessful = makeMove(row, col);
    if (!moveSuccessful) return;
    // Remove optimistic turn flip; rely on server 'move_made' for turn updates
    socket.emit('make_move', { row, col }, (response: any) => {
      if (response.error) {
        console.error('Move error:', response.error);
        // Revert the move if the server rejected it
        // This would require additional state management
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

  // Restart game functionality
  const restartGame = () => {
    const socket = socketRef.current;
    if (!socket) return;
    
    socket.emit('restart_game', {}, (response: any) => {
      if (response.error) {
        console.error('Restart error:', response.error);
        setConnectionError(response.error);
        return;
      }
      
      console.log('Game restarted:', response);
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

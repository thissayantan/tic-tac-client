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

    // Game-specific events - aligned with server implementation
    socket.on('player_joined', ({ roomId, playerId, role, opponentName, opponentAvatar, avatarId }) => {
      console.log(`Joined room: ${roomId}`);
      setRoomInfo(roomId, playerName, avatarId || 'globe');
      
      // Map server's role to client's symbol (X or O)
      const playerSymbol = role === PLAYER_ROLES.PLAYER_X ? 'X' : 'O';
      
      if (opponentName) {
        setPlayerInfo(playerSymbol, opponentName, opponentAvatar || null);
      }
    });

    socket.on('game_started', ({ players, currentPlayer }) => {
      console.log('Game started', players);
      // Find my player info in the players array
      const myPlayer = players.find(p => p.name === playerName);
      const opponentPlayer = players.find(p => p.name !== playerName);
      
      if (myPlayer && opponentPlayer) {
        const playerSymbol = myPlayer.role === PLAYER_ROLES.PLAYER_X ? 'X' : 'O';
        setPlayerInfo(playerSymbol, opponentPlayer.name, opponentPlayer.avatarId || null);
      }
      
      // Set current turn
      if (currentPlayer) {
        updateTurn(currentPlayer === PLAYER_ROLES.PLAYER_X ? 'X' : 'O');
      }
    });

    socket.on('move_made', ({ board, currentTurn }) => {
      console.log('Game update received', board, currentTurn);
      updateBoard(board);
      // Map server's role to client's symbol (X or O)
      const turn = currentTurn === PLAYER_ROLES.PLAYER_X ? 'X' : 'O';
      updateTurn(turn);
    });

    socket.on('game_over', ({ result, board, winner }) => {
      console.log('Game over:', result);
      updateBoard(board);
      
      const myPlayerSymbol = result.winner === playerName ? 'win' : 'lose';
      
      if (result.type === 'win') {
        updateGameStatus(myPlayerSymbol === 'win' ? 'won' : 'lost');
      } else {
        updateGameStatus('draw');
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
      playerName,
      avatarId // Custom avatar ID
    }, (response: any) => {
      if (response.error) {
        setConnectionError(response.error);
        return;
      }
      
      console.log('Room created:', response);
      setRoomInfo(response.roomId, playerName, avatarId);
    });
  };

  // Join room action - updated to match server expectations
  const joinRoom = (roomId: string, playerName: string, avatarId: string = 'globe') => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join_room', { 
      roomId, 
      playerName,
      avatarId // Custom avatar ID
    }, (response: any) => {
      if (response.error) {
        setConnectionError(response.error);
        return;
      }
      
      console.log('Joined room:', response);
      // The player_joined event handler will handle the state updates
    });
  };

  // Make a move action - updated to match server expectations
  const playerMove = (row: number, col: number) => {
    const socket = socketRef.current;
    if (!socket) return;

    const moveSuccessful = makeMove(row, col);
    if (!moveSuccessful) return;

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

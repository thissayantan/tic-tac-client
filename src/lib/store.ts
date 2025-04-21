import { create } from 'zustand';

type GameStatus = 'lobby' | 'waiting' | 'playing' | 'won' | 'lost' | 'draw';
type CellValue = 'X' | 'O' | null;

interface GameState {
  // Connection state
  connected: boolean;
  connectionError: string | null;
  
  // Room & player information
  roomId: string | null;
  playerName: string;
  playerSymbol: CellValue;
  playerAvatar: string;
  opponentName: string | null;
  opponentAvatar: string | null;
  
  // Game state
  board: CellValue[][];
  currentTurn: 'X' | 'O';
  gameStatus: GameStatus;
  winnerName: string | null;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setRoomInfo: (roomId: string, playerName: string, playerAvatar: string) => void;
  setPlayerInfo: (symbol: CellValue, opponentName: string | null, opponentAvatar: string | null) => void;
  updateBoard: (board: CellValue[][]) => void;
  updateTurn: (turn: 'X' | 'O') => void;
  updateGameStatus: (status: GameStatus) => void;
  resetGame: () => void;
  setWinnerName: (name: string | null) => void;
  makeMove: (row: number, col: number) => boolean;
}

// Define the initial game board as a 3x3 matrix with null values
const initialBoard: CellValue[][] = [
  [null, null, null],
  [null, null, null],
  [null, null, null]
];

// Create the game store
export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  connected: false,
  connectionError: null,
  roomId: null,
  playerName: '',
  playerSymbol: null,
  playerAvatar: 'cat',
  opponentName: null,
  opponentAvatar: null,
  board: initialBoard,
  currentTurn: 'X',  // X always goes first
  gameStatus: 'lobby',
  winnerName: null,
  
  // Actions
  setConnected: (connected) => set({ connected }),
  
  setConnectionError: (error) => set({ connectionError: error }),
  
  setRoomInfo: (roomId, playerName, playerAvatar) => set({ 
    roomId, 
    playerName,
    playerAvatar,
    gameStatus: 'waiting' 
  }),
  
  setPlayerInfo: (symbol, opponentName, opponentAvatar) => set({ 
    playerSymbol: symbol,
    opponentName,
    opponentAvatar
  }),
  
  updateBoard: (board) => set({ board }),
  
  updateTurn: (turn) => set({ currentTurn: turn }),
  
  updateGameStatus: (status) => set({ gameStatus: status }),
  
  resetGame: () => set({ 
    board: initialBoard,
    currentTurn: 'X',
    gameStatus: 'lobby',
    roomId: null,
    playerSymbol: null,
    opponentName: null,
    opponentAvatar: null,
    winnerName: null,
    // Keep playerName and playerAvatar for convenience
  }),
  setWinnerName: (name) => set({ winnerName: name }),
  makeMove: (row, col) => {
    const state = get();
    
    // Check if it's the player's turn
    if (state.currentTurn !== state.playerSymbol) return false;
    
    // Check if the cell is empty
    if (state.board[row][col] !== null) return false;
    
    // Create a new board with the updated move
    const newBoard = state.board.map(arr => [...arr]);
    newBoard[row][col] = state.playerSymbol;
    
    // Update the board
    set({ board: newBoard });
    
    return true;
  }
}));

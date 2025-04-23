import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSocketService } from '../lib/socket-service';

/**
 * Hook to handle room joining logic
 * @param {Object} userInfo Current user information
 * @returns {Object} Room joining state and methods
 */
export default function useRoomJoining() {
  const searchParams = useSearchParams();
  const roomIdFromURL = searchParams?.get('room');
  const router = useRouter();
  
  // Use the socket service hook to get access to the initialized socket
  const { socket, initializeSocket } = useSocketService();
  
  const [roomDetails, setRoomDetails] = useState(null);
  const [joinMode, setJoinMode] = useState(null); // 'create', 'join', or 'spectate'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check room status when component mounts if room ID is in URL
  useEffect(() => {
    if (roomIdFromURL) {
      setLoading(true);
      // Request room details from server
      socket.emit('check-room', { roomId: roomIdFromURL }, (response) => {
        setLoading(false);
        
        if (response.success) {
          setRoomDetails(response);
          setJoinMode(response.joinMode);
        } else {
          setError('Room not found or no longer available');
        }
      });
    } else {
      setLoading(false);
      // No room ID in URL, default to create mode
      setJoinMode('create');
    }
  }, [roomIdFromURL, socket]);

  // Join the room as appropriate role
  const joinRoom = (playerInfo) => {
    if (!playerInfo.name || !playerInfo.avatar) {
      return { success: false, error: 'Please provide name and avatar' };
    }
    
    // Initialize the socket if not already initialized
    if (!socket) {
      initializeSocket();
      return { success: false, error: 'Connecting to server, please try again in a moment' };
    }
    
    const name = playerInfo.name.trim();
    const avatar = playerInfo.avatar;
    
    console.log('Joining room with mode:', joinMode, 'player:', { name, avatar });
    
    if (joinMode === 'create') {
      socket.emit('create_room', { name, avatar }, (response) => {
        console.log('Create room response:', response);
        if (response.success) {
          router.replace(`/game?room=${response.roomId}`);
          setTimeout(() => window.location.reload(), 100);
        } else {
          setError(response.error);
        }
      });
    } else if (joinMode === 'join' || joinMode === 'spectate') {
      socket.emit('join_room', { roomId: roomIdFromURL, name, avatar }, (response) => {
        console.log('Join room response:', response);
        if (response.success) {
          router.replace(`/game?room=${roomIdFromURL}`);
          setTimeout(() => window.location.reload(), 100);
        } else {
          setError(response.error);
        }
      });
    }
  };

  return {
    roomDetails,
    joinMode,
    loading,
    error,
    joinRoom
  };
}

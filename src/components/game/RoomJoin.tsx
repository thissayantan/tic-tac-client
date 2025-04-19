"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";

interface RoomJoinProps {
  onCreateRoom: (playerName: string, avatarId: string) => void;
  onJoinRoom: (roomId: string, playerName: string, avatarId: string) => void;
  isLoading?: boolean;
}

export function RoomJoin({ onCreateRoom, onJoinRoom, isLoading = false }: RoomJoinProps) {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [avatarId, setAvatarId] = useState("cat");
  const [joinMode, setJoinMode] = useState<"create" | "join">("create");
  const router = useRouter();
  const searchParams = useSearchParams();
  const avatarScrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Direct list of avatars from the screenshot
  const avatars = [
    "bear", "cat", "chicken", "deer", "dog", "dragon", 
    "elephant", "fox", "giraffe", "goose", "hummingbird",
    "kiwi", "lion", "ostrich", "parrot", "rabbit", 
    "small_bird", "squirrel", "swan", "toucan", "unicorn"
  ];

  useEffect(() => {
    const inviteCode = searchParams?.get('room');
    if (inviteCode) {
      setRoomId(inviteCode);
      setJoinMode("join");
    }
  }, [searchParams]);

  const handleSubmit = () => {
    if (!playerName.trim()) return;
    
    if (joinMode === "create") {
      onCreateRoom(playerName.trim(), avatarId);
    } else {
      if (!roomId.trim()) return;
      onJoinRoom(roomId.trim(), playerName.trim(), avatarId);
    }
  };

  const scrollAvatars = (direction: 'left' | 'right') => {
    if (avatarScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      avatarScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const selectAvatar = (avatar: string) => {
    setAvatarId(avatar);
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Try to load the corresponding sound file
      const audio = new Audio(`/sounds/${avatar}.mp3`);
      audioRef.current = audio;
      audio.volume = 0.5;
      
      // Play the audio with error handling
      audio.play().catch(err => {
        console.log("Sound playback failed or not available:", err);
      });
    } catch (error) {
      console.log("Error playing sound:", error);
    }
  };

  // Handle wheel scrolling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (avatarScrollRef.current) {
      avatarScrollRef.current.scrollLeft += e.deltaY > 0 ? 100 : -100;
    }
  };

  const clearName = () => {
    setPlayerName("");
  };

  return (
    <div className="fixed inset-0 w-full min-h-screen bg-black flex flex-col items-center">
      {/* Page title */}
      <div className="w-full text-center py-6">
        <h1 className="text-2xl font-bold text-white">Tic Tac Toe</h1>
      </div>
      
      {/* Content container */}
      <div className="flex-1 w-full flex flex-col items-center px-4 pb-10">
        {/* Changed from "Edit Profile" to just "Profile" */}
        <h2 className="text-xl font-bold text-white mt-8 mb-10">Profile</h2>
        
        {/* Avatar selector - keeping full width */}
        <div className="w-full relative mb-12">
          <button 
            onClick={() => scrollAvatars('left')} 
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 rounded-full"
            aria-label="Previous avatar"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          
          <div 
            ref={avatarScrollRef}
            className="w-full overflow-x-auto hide-scrollbar py-10"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onWheel={handleWheel}
          >
            <div className="flex space-x-10 px-12 min-w-max justify-center">
              {avatars.map((avatar) => (
                <div 
                  key={avatar}
                  onClick={() => selectAvatar(avatar)}
                  className={`relative flex-shrink-0 flex flex-col items-center transition-all duration-300 ${
                    avatarId === avatar 
                      ? 'scale-110 -translate-y-3 hover:scale-115' 
                      : 'opacity-70 hover:opacity-90 hover:-translate-y-1'
                  }`}
                >
                  <div className={`relative rounded-full overflow-hidden border-2 ${
                    avatarId === avatar 
                      ? 'w-24 h-24 border-white ring-2 ring-white shadow-lg shadow-blue-500/30 animate-pulse-slow' 
                      : 'w-20 h-20 border-transparent hover:border-gray-400 transition-all'
                  }`}>
                    <img 
                      src={`/avatars/${avatar}.png`} 
                      alt={avatar}
                      className={`object-cover w-full h-full transition-transform duration-500 ${
                        avatarId === avatar ? 'scale-105' : 'hover:scale-110'
                      }`}
                    />
                  </div>
                  
                  {/* Checkmark positioned at the TOP-RIGHT of the avatar */}
                  {avatarId === avatar && (
                    <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-md z-10 animate-fadeIn">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        width="18" 
                        height="18" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="text-black animate-checkmark"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                  
                  <span className={`text-sm mt-3 transition-all ${
                    avatarId === avatar ? 'text-white font-medium' : 'text-gray-400'
                  } capitalize`}>
                    {avatar.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => scrollAvatars('right')} 
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 rounded-full"
            aria-label="Next avatar"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Profile Name Input - now constrained width */}
        <div className="w-full max-w-md px-4 mb-10">
          <div className="text-xs text-gray-400 mb-2 uppercase">PROFILE NAME</div>
          <div className="relative">
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-[#1a1a1a] border-0 text-white py-6 px-4 rounded-lg text-lg"
              placeholder="Enter your name"
              disabled={isLoading}
            />
            {playerName && (
              <button
                onClick={clearName}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full hover:bg-gray-800 p-1"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Submit Button - constrained width and renamed */}
        <div className="w-full max-w-md px-4 mb-10">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !playerName.trim() || !avatarId}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-full text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}

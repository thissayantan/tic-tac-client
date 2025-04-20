"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { AuthService } from "@/lib/auth-service";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UserProfileProps {
  username: string;
  avatarId?: string;
  onLogout: () => void;
}

export function UserProfile({ username, avatarId = "globe", onLogout }: UserProfileProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Initialize audio on client side
  useEffect(() => {
    setAudio(new Audio(`/sounds/${avatarId}.mp3`));
  }, [avatarId]);
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleAvatarClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleAvatarHover = () => {
    // Play sound on hover
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log("Audio play failed:", e));
    }
  };
  
  return (
    <div className="relative" ref={menuRef}>
      <div 
        className="absolute top-2 left-2 z-10 cursor-pointer transition-transform duration-300 hover:scale-110"
        onClick={handleAvatarClick}
        onMouseEnter={handleAvatarHover}
      >
        <div className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-primary">
          <Image
            src={`/avatars/${avatarId}.png`}
            alt={`${username}'s avatar`}
            width={40}
            height={40}
            className={`w-10 h-10 transition-all duration-500 ${isMenuOpen ? 'rotate-12' : 'hover:rotate-12'}`}
          />
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="absolute top-16 left-2 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2 min-w-40 border border-muted">
          <div className="flex items-center gap-2 p-2 border-b border-muted mb-2">
            <Image
              src={`/avatars/${avatarId}.png`}
              alt={`${username}'s avatar`}
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span className="font-medium">{username}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onLogout}
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}

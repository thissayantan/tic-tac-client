import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelect: (avatarId: string) => void;
  avatars?: string[];
}

export function AvatarSelector({ 
  selectedAvatar, 
  onSelect,
  avatars = ["globe", "cat", "dog", "penguin", "panda", "robot", "alien", 
             "unicorn", "fox", "owl", "rabbit", "lion", "tiger", "monkey"]
}: AvatarSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollAvatars = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative my-8">
      <button 
        onClick={() => scrollAvatars('left')} 
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 rounded-full p-2"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto hide-scrollbar py-4 px-8 gap-4 relative"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {avatars.map((avatar) => (
          <div 
            key={avatar}
            onClick={() => onSelect(avatar)}
            className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
              selectedAvatar === avatar 
                ? 'ring-4 ring-white scale-110 relative' 
                : 'opacity-70 scale-90'
            }`}
          >
            <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
              {/* Replace with your actual avatar images */}
              <div className="text-2xl">{avatar.charAt(0).toUpperCase()}</div>
            </div>
            {selectedAvatar === avatar && (
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => scrollAvatars('right')} 
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 rounded-full p-2"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}

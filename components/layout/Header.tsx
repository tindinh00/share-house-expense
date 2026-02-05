'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/contexts/RoomContext';
import Link from 'next/link';
import { InvitationsDropdown } from '@/components/InvitationsDropdown';
import { motion } from 'framer-motion';
import { 
  Home, 
  Briefcase, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Check,
  House
} from 'lucide-react';

const Path = (props: React.ComponentPropsWithoutRef<typeof motion.path>) => (
  <motion.path
    fill="transparent"
    strokeWidth="3"
    stroke="white"
    strokeLinecap="round"
    {...props}
  />
);

interface HeaderProps {
  user: User;
  profile: {
    username?: string;
  } | null;
  onMenuClick: () => void;
  isSidebarOpen?: boolean;
}

export default function Header({ user, profile, onMenuClick, isSidebarOpen = false }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { currentRoom, rooms, setCurrentRoom } = useRoom();

  const getRoomColor = (roomId: string, roomType?: string) => {
    if (roomType === 'PRIVATE') {
      return { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        border: 'border-amber-300', 
        hover: 'hover:bg-amber-100' 
      };
    }
    
    const colors = [
      { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
      { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
      { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', hover: 'hover:bg-pink-100' },
      { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', hover: 'hover:bg-emerald-100' },
      { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', hover: 'hover:bg-teal-100' },
      { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', hover: 'hover:bg-indigo-100' },
    ];
    
    const hash = roomId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowUserMenu(false);
    await supabase.auth.signOut();
    router.push('/login?logout=success');
  };

  return (
    <header className="bg-primary/95 backdrop-blur-md shadow-lg sticky top-0 z-[100] safe-area-top border-b border-white/10">
      <div className="px-4 md:px-6 lg:px-8 pt-safe">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/20 transition-all duration-300 mr-2 relative overflow-hidden tap-highlight"
            aria-label="Toggle menu"
          >
            <motion.svg
              width="23"
              height="23"
              viewBox="0 0 23 23"
              initial={false}
              animate={isSidebarOpen ? "open" : "closed"}
            >
              <Path
                variants={{
                  closed: { d: "M 2 2.5 L 20 2.5" },
                  open: { d: "M 3 16.5 L 17 2.5" },
                }}
              />
              <Path
                d="M 2 9.423 L 20 9.423"
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 },
                }}
                transition={{ duration: 0.1 }}
              />
              <Path
                variants={{
                  closed: { d: "M 2 16.346 L 20 16.346" },
                  open: { d: "M 3 2.5 L 17 16.346" },
                }}
              />
            </motion.svg>
          </button>

          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <h1 className="flex items-center gap-2 text-base sm:text-xl font-bold text-white truncate">
              <House className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline">Chi tiêu nhà chung</span>
            </h1>
            
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowRoomMenu(!showRoomMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-all duration-300 backdrop-blur-sm border border-white/10 tap-highlight"
              >
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  {currentRoom ? (
                    <>
                      {currentRoom.type === 'PRIVATE' ? <Briefcase className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                      <span className="truncate max-w-[120px]">{currentRoom.name}</span>
                    </>
                  ) : (
                    'Chọn không gian'
                  )}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-white/70 transition-transform duration-300 ${
                    showRoomMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showRoomMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowRoomMenu(false)} />
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {rooms.length === 0 ? (
                      <div className="px-4 py-3 text-center">
                        <p className="text-sm text-gray-500 mb-2">Chưa có không gian nào</p>
                        <Link
                          href="/rooms/create"
                          onClick={() => setShowRoomMenu(false)}
                          className="text-sm text-primary font-semibold hover:underline"
                        >
                          Tạo không gian mới
                        </Link>
                      </div>
                    ) : (
                      <>
                        {rooms.map((room) => {
                          const roomColor = getRoomColor(room.id, room.type);
                          return (
                            <button
                              key={room.id}
                              onClick={() => {
                                setCurrentRoom(room);
                                setShowRoomMenu(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                                currentRoom?.id === room.id 
                                  ? `${roomColor.bg} ${roomColor.text} font-bold` 
                                  : `text-gray-700 ${roomColor.hover}`
                              }`}
                            >
                              {room.type === 'PRIVATE' ? <Briefcase className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                              <span className="flex-1 truncate">{room.name}</span>
                              {currentRoom?.id === room.id && <Check className="w-4 h-4" />}
                            </button>
                          );
                        })}
                        <div className="border-t border-gray-50 mt-2 pt-2">
                          <Link
                            href="/rooms"
                            onClick={() => setShowRoomMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-primary font-semibold hover:bg-gray-50"
                          >
                            <Settings className="w-4 h-4 text-gray-400" /> Quản lý không gian
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <InvitationsDropdown />

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-xl hover:bg-white/20 transition-all duration-300 tap-highlight"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full flex items-center justify-center text-primary font-bold shadow-inner text-sm">
                {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-bold text-white leading-tight">
                  {profile?.username || 'User'}
                </p>
                <p className="text-[10px] text-white/70 truncate max-w-[100px]">{user.email}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-white/70 transition-transform duration-300 ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 rounded-t-2xl">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {profile?.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" /> Cài đặt tài khoản
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" /> {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

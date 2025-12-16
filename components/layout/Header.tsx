'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/contexts/RoomContext';
import Link from 'next/link';
import { InvitationsDropdown } from '@/components/InvitationsDropdown';

interface HeaderProps {
  user: User;
  profile: any;
  onMenuClick: () => void;
}

export default function Header({ user, profile, onMenuClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { currentRoom, rooms, setCurrentRoom } = useRoom();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowUserMenu(false);
    
    await supabase.auth.signOut();
    
    // Redirect to login with logout success flag
    router.push('/login?logout=success');
  };

  return (
    <header className="bg-gradient-to-r from-green-600 to-green-500 shadow-md sticky top-0 z-50">
      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Hamburger Menu Button (Mobile & Desktop) */}
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/20 transition mr-2"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo & Room Selector */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white truncate">
              🏠 <span className="hidden sm:inline">Chi tiêu nhà chung</span>
            </h1>
            
            {/* Room Selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowRoomMenu(!showRoomMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition backdrop-blur-sm"
              >
                <span className="text-sm font-medium text-white">
                  {currentRoom ? (
                    <>
                      {currentRoom.type === 'PRIVATE' ? '💼' : '🏠'} {currentRoom.name}
                    </>
                  ) : (
                    'Chọn không gian'
                  )}
                </span>
                <svg
                  className={`w-4 h-4 text-white transition-transform ${
                    showRoomMenu ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Room Dropdown */}
              {showRoomMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowRoomMenu(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 max-h-96 overflow-y-auto">
                    {rooms.length === 0 ? (
                      <div className="px-4 py-3 text-center">
                        <p className="text-sm text-gray-500 mb-2">Chưa có không gian nào</p>
                        <Link
                          href="/rooms/create"
                          onClick={() => setShowRoomMenu(false)}
                          className="text-sm text-green-600 hover:underline"
                        >
                          Tạo không gian mới
                        </Link>
                      </div>
                    ) : (
                      <>
                        {rooms.map((room) => (
                          <button
                            key={room.id}
                            onClick={() => {
                              setCurrentRoom(room);
                              setShowRoomMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                              currentRoom?.id === room.id ? 'bg-green-50 text-green-700' : 'text-gray-700'
                            }`}
                          >
                            <span>{room.type === 'PRIVATE' ? '💼' : '🏠'}</span>
                            <span className="flex-1">{room.name}</span>
                            {currentRoom?.id === room.id && (
                              <span className="text-green-600">✓</span>
                            )}
                          </button>
                        ))}
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <Link
                            href="/rooms"
                            onClick={() => setShowRoomMenu(false)}
                            className="block px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                          >
                            ⚙️ Quản lý không gian
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Invitations */}
          <InvitationsDropdown />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/20 transition"
            >
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-600 font-medium">
                {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white">
                  {profile?.username || 'User'}
                </p>
                <p className="text-xs text-green-100">{user.email}</p>
              </div>
              <svg
                className={`w-4 h-4 text-white transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  
                  <a
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    ⚙️ Cài đặt
                  </a>
                  
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    🚪 {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
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

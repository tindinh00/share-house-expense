'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRoom } from '@/contexts/RoomContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Tổng quan', href: '/dashboard', icon: '📊' },
  { name: 'Giao dịch', href: '/transactions', icon: '💰' },
  { name: 'Không gian', href: '/rooms', icon: '🏠' },
  { name: 'Hộ gia đình', href: '/households', icon: '👨‍👩‍👧‍👦' },
  { name: 'Báo cáo', href: '/reports', icon: '📈' },
  { name: 'Cài đặt', href: '/settings', icon: '⚙️' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { currentRoom, rooms, setCurrentRoom, loading } = useRoom();

  // Only close sidebar on mobile when clicking links
  const handleLinkClick = () => {
    // Check if mobile (window width < 768px)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      {/* Mobile Floating Menu Button */}
      <button
        onClick={onToggle}
        className="md:hidden fixed bottom-20 right-4 z-50 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all active:scale-95"
        aria-label="Toggle menu"
      >
        <svg
          className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-45' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Overlay - Only on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 bg-white shadow-lg z-50
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-16'}
        `}
      >
        <nav className="p-2 md:p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    prefetch={true}
                    onClick={handleLinkClick}
                    className={`
                      flex items-center gap-3 px-3 md:px-4 py-3 rounded-lg font-medium transition
                      ${
                        isActive
                          ? 'bg-green-50 text-green-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${!isOpen ? 'md:justify-center' : ''}
                    `}
                  >
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <span className={`${!isOpen ? 'md:hidden' : ''}`}>{item.name}</span>
                  </Link>
                </TooltipTrigger>
                {!isOpen && (
                  <TooltipContent side="right" className="font-medium hidden md:block">
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Room Selector */}
        <div className={`p-2 md:p-4 border-t border-gray-200 mt-4 space-y-3 ${!isOpen ? 'md:hidden' : ''}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Không gian hiện tại
          </label>
          {loading ? (
            <Button variant="outline" className="w-full justify-start" disabled>
              <span className="mr-2">⏳</span>
              Đang tải...
            </Button>
          ) : rooms.length > 0 ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span>{currentRoom?.type === 'PRIVATE' ? '💼' : '🏠'}</span>
                      <span className="truncate">{currentRoom?.name || 'Chọn không gian'}</span>
                    </span>
                    <svg
                      className="ml-2 h-4 w-4 shrink-0 opacity-50"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuLabel>Chọn không gian</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {rooms.map((room) => (
                    <DropdownMenuItem
                      key={room.id}
                      onClick={() => setCurrentRoom(room)}
                      className={`cursor-pointer ${currentRoom?.id === room.id ? 'bg-green-50' : ''}`}
                    >
                      <span className="mr-2">{room.type === 'PRIVATE' ? '💼' : '🏠'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{room.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.type === 'PRIVATE' ? 'Riêng tư' : 'Chia sẻ'}
                        </p>
                      </div>
                      {currentRoom?.id === room.id && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">Chưa có không gian</p>
            </div>
          )}
          
          <Link href="/rooms/create" onClick={handleLinkClick}>
            <Button 
              variant="outline" 
              className="w-full justify-start border-dashed hover:border-green-500 hover:bg-green-50 hover:text-green-600"
            >
              <span className="mr-2">➕</span>
              Tạo không gian mới
            </Button>
          </Link>
        </div>
        
        {/* Collapsed Room Icon */}
        {!isOpen && currentRoom && (
          <div className="hidden md:flex items-center justify-center p-4 border-t border-gray-200 mt-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-xl cursor-pointer hover:bg-green-100 transition"
                >
                  {currentRoom.type === 'PRIVATE' ? '💼' : '🏠'}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                <p>{currentRoom.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentRoom.type === 'PRIVATE' ? 'Riêng tư' : 'Chia sẻ'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

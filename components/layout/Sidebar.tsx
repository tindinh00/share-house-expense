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

  // Generate color for room based on room type and ID
  const getRoomColor = (roomId: string, roomType?: string) => {
    // Private room (Ví cá nhân) always gets amber/yellow color
    if (roomType === 'PRIVATE') {
      return { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        border: 'border-amber-300', 
        hover: 'hover:bg-amber-100' 
      };
    }
    
    // Shared rooms get different colors
    const colors = [
      { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
      { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
      { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', hover: 'hover:bg-pink-100' },
      { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', hover: 'hover:bg-emerald-100' },
      { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', hover: 'hover:bg-teal-100' },
      { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', hover: 'hover:bg-indigo-100' },
    ];
    
    // Use room ID to consistently pick a color
    const hash = roomId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <TooltipProvider delayDuration={300}>
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
        {/* Room Selector - Moved to top */}
        <div className={`p-2 md:p-4 border-b border-gray-200 space-y-3 ${!isOpen ? 'md:hidden' : ''}`}>
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
                    className={`w-full justify-between text-left font-normal border-2 ${
                      currentRoom ? getRoomColor(currentRoom.id, currentRoom.type).border + ' ' + getRoomColor(currentRoom.id, currentRoom.type).bg : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span>{currentRoom?.type === 'PRIVATE' ? '💼' : '🏠'}</span>
                      <span className={`truncate font-medium ${currentRoom ? getRoomColor(currentRoom.id, currentRoom.type).text : ''}`}>
                        {currentRoom?.name || 'Chọn không gian'}
                      </span>
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
                  {rooms.map((room) => {
                    const roomColor = getRoomColor(room.id, room.type);
                    return (
                      <DropdownMenuItem
                        key={room.id}
                        onClick={() => setCurrentRoom(room)}
                        className={`cursor-pointer ${
                          currentRoom?.id === room.id 
                            ? `${roomColor.bg} ${roomColor.text}` 
                            : roomColor.hover
                        }`}
                      >
                        <span className="mr-2">{room.type === 'PRIVATE' ? '💼' : '🏠'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{room.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {room.type === 'PRIVATE' ? 'Riêng tư' : 'Chia sẻ'}
                          </p>
                        </div>
                        {currentRoom?.id === room.id && (
                          <span className="ml-2">✓</span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
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

        {/* Collapsed Room Icon - When sidebar is collapsed */}
        {!isOpen && currentRoom && (
          <div className="hidden md:flex items-center justify-center p-4 border-b border-gray-200">
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl cursor-pointer transition border-2 ${
                    getRoomColor(currentRoom.id, currentRoom.type).bg + ' ' + 
                    getRoomColor(currentRoom.id, currentRoom.type).border + ' ' + 
                    getRoomColor(currentRoom.id, currentRoom.type).hover
                  }`}
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

        <nav className="p-2 md:p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const roomColor = currentRoom ? getRoomColor(currentRoom.id, currentRoom.type) : null;
            
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
                        isActive && roomColor
                          ? `${roomColor.bg} ${roomColor.text}`
                          : isActive
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
      </aside>
    </TooltipProvider>
  );
}

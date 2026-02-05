'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRoom } from '@/contexts/RoomContext';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
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

import { 
  LayoutDashboard, 
  History, 
  Calendar, 
  BarChart3, 
  Home, 
  Users, 
  Settings,
  Plus,
  Briefcase,
  Layers
} from 'lucide-react';

const navigation = [
  { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Giao dịch', href: '/transactions', icon: History },
  { name: 'Hóa đơn tháng', href: '/bills', icon: Calendar },
  { name: 'Báo cáo', href: '/reports', icon: BarChart3 },
  { name: 'Không gian', href: '/rooms', icon: Layers },
  { name: 'Hộ gia đình', href: '/households', icon: Users },
  { name: 'Cài đặt', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const sidebarVariants: Variants = {
  open: (height = 1000) => ({
    clipPath: `circle(${height + 500}px at 40px 40px)`,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 20,
      restDelta: 2,
    },
  }),
  closed: {
    clipPath: "circle(0px at 40px 40px)",
    opacity: 0,
    transition: {
      delay: 0.1,
      type: "spring",
      stiffness: 400,
      damping: 40,
    },
  },
};

const navVariants: Variants = {
  open: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
  closed: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

const itemVariants: Variants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: { stiffness: 1000 },
    },
  },
};

export default function Sidebar({ isOpen, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { currentRoom, rooms, setCurrentRoom, loading } = useRoom();
  const containerRef = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(1000);

  useEffect(() => {
    if (containerRef.current) {
      setHeight(containerRef.current.offsetHeight);
    }
  }, []);

  // Only close sidebar on mobile when clicking links
  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  };

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

  return (
    <TooltipProvider delayDuration={300}>
      <AnimatePresence>
        {/* Overlay */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        ref={containerRef}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        custom={height}
        variants={sidebarVariants}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        className={`fixed top-16 left-0 bottom-0 bg-white shadow-lg z-[60] overflow-hidden w-64 md:pointer-events-auto ${
          !isOpen ? 'md:w-16' : ''
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Room Selector */}
          <motion.div 
            variants={itemVariants}
            className={`p-2 md:p-4 border-b border-gray-200 space-y-3 ${!isOpen ? 'md:hidden' : ''}`}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Không gian hiện tại
            </label>
            {loading ? (
              <Button variant="outline" className="w-full justify-start" disabled>
                <span className="mr-2">⏳</span>
                Đang tải...
              </Button>
            ) : rooms.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-between text-left font-normal border-2 ${
                      currentRoom ? getRoomColor(currentRoom.id, currentRoom.type).border + ' ' + getRoomColor(currentRoom.id, currentRoom.type).bg : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span>{currentRoom?.type === 'PRIVATE' ? <Briefcase className="w-4 h-4" /> : <Home className="w-4 h-4" />}</span>
                      <span className={`truncate font-medium ${currentRoom ? getRoomColor(currentRoom.id, currentRoom.type).text : ''}`}>
                        {currentRoom?.name || 'Chọn không gian'}
                      </span>
                    </span>
                    <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        onClick={() => {
                          setCurrentRoom(room);
                          onClose();
                        }}
                        className={`cursor-pointer ${currentRoom?.id === room.id ? `${roomColor.bg} ${roomColor.text}` : roomColor.hover}`}
                      >
                        <span className="mr-2">{room.type === 'PRIVATE' ? <Briefcase className="w-4 h-4" /> : <Home className="w-4 h-4" />}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.type === 'PRIVATE' ? 'Riêng tư' : 'Chia sẻ'}</p>
                        </div>
                        {currentRoom?.id === room.id && <span className="ml-2 text-primary">✓</span>}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">Chưa có không gian</p>
              </div>
            )}
            
            <Link href="/rooms/create" onClick={handleLinkClick}>
              <Button variant="outline" className="w-full justify-start border-dashed hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 tap-highlight">
                <Plus className="w-4 h-4 mr-2" />
                Tạo không gian mới
              </Button>
            </Link>
          </motion.div>

          {/* Collapsed Room Icon */}
          {!isOpen && currentRoom && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="hidden md:flex items-center justify-center p-4 border-b border-gray-200"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl cursor-pointer transition border-2 ${getRoomColor(currentRoom.id, currentRoom.type).bg + ' ' + getRoomColor(currentRoom.id, currentRoom.type).border}`}>
                    {currentRoom.type === 'PRIVATE' ? <Briefcase className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  <p>{currentRoom.name}</p>
                  <p className="text-xs text-muted-foreground">{currentRoom.type === 'PRIVATE' ? 'Riêng tư' : 'Chia sẻ'}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}

          {/* Navigation Items */}
          <motion.nav 
            variants={navVariants}
            className="p-2 md:p-4 space-y-2 flex-1 overflow-y-auto overflow-x-hidden"
          >
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const roomColor = currentRoom ? getRoomColor(currentRoom.id, currentRoom.type) : null;
              
              return (
                <motion.div key={item.name} variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        prefetch={true}
                        onClick={handleLinkClick}
                        className={`
                          flex items-center gap-3 px-3 md:px-4 py-3 rounded-lg font-medium transition-colors
                          ${isActive && roomColor ? `${roomColor.bg} ${roomColor.text}` : isActive ? 'bg-green-50 text-green-600' : 'text-gray-700 hover:bg-gray-100'}
                          ${!isOpen ? 'md:justify-center' : ''}
                        `}
                      >
                        <item.icon className={`w-6 h-6 shrink-0 ${isActive ? 'scale-110' : ''} transition-transform duration-300`} />
                        <span className={`${!isOpen ? 'md:hidden opacity-0' : 'opacity-100'} transition-opacity duration-300 whitespace-nowrap`}>
                          {item.name}
                        </span>
                      </Link>
                    </TooltipTrigger>
                    {!isOpen && (
                      <TooltipContent side="right" className="font-medium hidden md:block">
                        {item.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </motion.div>
              );
            })}
          </motion.nav>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

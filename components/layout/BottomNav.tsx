'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRoom } from '@/contexts/RoomContext';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Plus, 
  BarChart3, 
  History 
} from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { currentRoom } = useRoom();

  // Generate color for room based on room type and ID
  const getRoomColor = (roomId: string, roomType?: string) => {
    // Private room (Ví cá nhân) always gets amber/yellow color
    if (roomType === 'PRIVATE') {
      return { 
        text: 'text-amber-700'
      };
    }
    
    // Shared rooms get different colors
    const colors = [
      { text: 'text-blue-600' },
      { text: 'text-purple-600' },
      { text: 'text-pink-600' },
      { text: 'text-emerald-600' },
      { text: 'text-teal-600' },
      { text: 'text-indigo-600' },
    ];

    // Use room ID to consistently pick a color
    const hash = roomId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { href: '/transactions', icon: History, label: 'Giao dịch' },
    { href: '/transactions/add', icon: Plus, label: 'Thêm', isCenter: true },
    { href: '/bills', icon: ReceiptText, label: 'Hóa đơn' },
    { href: '/reports', icon: BarChart3, label: 'Báo cáo' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass safe-bottom z-[100] border-t border-white/20">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-8 tap-highlight"
              >
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:brightness-110 active:scale-90 transition-all duration-300">
                  <Plus className="w-8 h-8 text-white" />
                </div>
              </Link>
            );
          }

          const roomColor = currentRoom ? getRoomColor(currentRoom.id, currentRoom.type) : null;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 tap-highlight ${
                isActive && roomColor
                  ? roomColor.text
                  : isActive
                  ? 'text-primary'
                  : 'text-gray-400'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform duration-300`} />
              <span className="text-[10px] font-bold tracking-tight uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

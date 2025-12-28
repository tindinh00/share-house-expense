'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRoom } from '@/contexts/RoomContext';

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
    { href: '/dashboard', icon: '📊', label: 'Tổng quan' },
    { href: '/transactions', icon: '💰', label: 'Giao dịch' },
    { href: '/transactions/add', icon: '➕', label: 'Thêm', isCenter: true },
    { href: '/bills', icon: '📅', label: 'Hóa đơn' },
    { href: '/reports', icon: '📈', label: 'Báo cáo' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-[100]">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-8"
              >
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition active:scale-95">
                  <span className="text-2xl text-white">+</span>
                </div>
              </Link>
            );
          }

          const roomColor = currentRoom ? getRoomColor(currentRoom.id, currentRoom.type) : null;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition ${
                isActive && roomColor
                  ? roomColor.text
                  : isActive
                  ? 'text-green-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

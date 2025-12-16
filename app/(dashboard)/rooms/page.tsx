'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface RoomWithMembers {
  id: string;
  name: string;
  type: 'SHARED' | 'PRIVATE';
  split_by: 'USER' | 'HOUSEHOLD';
  created_at: string;
  member_count: number;
}

export default function RoomsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { rooms, currentRoom, setCurrentRoom, refreshRooms } = useRoom();
  const [roomsWithMembers, setRoomsWithMembers] = useState<RoomWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoomsWithMembers();
  }, [rooms]);

  const loadRoomsWithMembers = async () => {
    setLoading(true);
    try {
      const roomsData: RoomWithMembers[] = await Promise.all(
        rooms.map(async (room) => {
          const { count } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          return {
            id: room.id,
            name: room.name,
            type: room.type,
            split_by: room.split_by,
            created_at: room.created_at,
            member_count: count || 0,
          };
        })
      );

      setRoomsWithMembers(roomsData);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = (room: any) => {
    setCurrentRoom(room);
    toast.success(`✅ Đã chuyển sang ${room.name}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Không gian
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý các không gian chi tiêu của bạn
          </p>
        </div>
        <Link href="/rooms/create">
          <Button size="lg">
            <span className="mr-2">➕</span>
            Tạo mới
          </Button>
        </Link>
      </div>

      {/* Rooms Grid */}
      {roomsWithMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomsWithMembers.map((room) => {
            const isActive = currentRoom?.id === room.id;
            
            return (
              <Card 
                key={room.id} 
                className={`hover:shadow-lg transition ${
                  isActive ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">
                          {room.type === 'PRIVATE' ? '💼' : '🏠'}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">
                          {room.type === 'PRIVATE' ? 'Riêng tư' : 'Chia sẻ'}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Đang dùng
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Thành viên</span>
                    <span className="font-medium">{room.member_count} người</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Chia theo</span>
                    <span className="font-medium">
                      {room.split_by === 'USER' ? 'Người dùng' : 'Hộ gia đình'}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(room)}
                        className="flex-1"
                      >
                        Chọn
                      </Button>
                    )}
                    <Link href={`/rooms/${room.id}`} className="flex-1">
                      <Button
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                      >
                        Chi tiết
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <span className="text-6xl">🏠</span>
            <p className="text-gray-600 mt-4 mb-6">
              Chưa có không gian nào
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Tạo không gian đầu tiên để bắt đầu quản lý chi tiêu
            </p>
            <Link href="/rooms/create">
              <Button size="lg">
                <span className="mr-2">➕</span>
                Tạo không gian đầu tiên
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

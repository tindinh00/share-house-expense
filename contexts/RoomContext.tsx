'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Room {
  id: string;
  name: string;
  type: 'SHARED' | 'PRIVATE';
  split_by: 'USER' | 'HOUSEHOLD';
  created_at: string;
}

interface RoomContextType {
  currentRoom: Room | null;
  rooms: Room[];
  setCurrentRoom: (room: Room) => void;
  loading: boolean;
  refreshRooms: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [currentRoom, setCurrentRoomState] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadRooms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get rooms where user is a member (directly or through household)
      const { data: roomMembers } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id);

      // Also get rooms where user's household is a member
      const { data: userHouseholds } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id);

      const householdIds = (userHouseholds || []).map(h => h.household_id);
      
      let householdRoomMembers: any[] = [];
      if (householdIds.length > 0) {
        const { data } = await supabase
          .from('room_members')
          .select('room_id')
          .in('household_id', householdIds);
        householdRoomMembers = data || [];
      }

      const allRoomMembers = [...(roomMembers || []), ...householdRoomMembers];

      if (!allRoomMembers || allRoomMembers.length === 0) {
        // Create default room if none exists
        const { data: newRoom } = await supabase
          .from('rooms')
          .insert({
            name: 'Ví cá nhân',
            type: 'PRIVATE',
            split_by: 'USER',
            created_by: user.id,
          })
          .select()
          .single();

        if (newRoom) {
          await supabase.from('room_members').insert({
            room_id: newRoom.id,
            user_id: user.id,
          });

          setRooms([newRoom]);
          setCurrentRoomState(newRoom);
          localStorage.setItem('currentRoomId', newRoom.id);
        }
        return;
      }

      // Fetch room details (remove duplicates)
      const roomIds = [...new Set(allRoomMembers.map(rm => rm.room_id))];
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .in('id', roomIds)
        .order('created_at', { ascending: true });

      if (roomsData && roomsData.length > 0) {
        setRooms(roomsData);

        // Restore last selected room from localStorage
        const savedRoomId = localStorage.getItem('currentRoomId');
        const savedRoom = roomsData.find(r => r.id === savedRoomId);
        
        setCurrentRoomState(savedRoom || roomsData[0]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentRoom = (room: Room) => {
    setCurrentRoomState(room);
    localStorage.setItem('currentRoomId', room.id);
  };

  const refreshRooms = async () => {
    setLoading(true);
    await loadRooms();
  };

  useEffect(() => {
    loadRooms();
  }, []);

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        rooms,
        setCurrentRoom,
        loading,
        refreshRooms,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}

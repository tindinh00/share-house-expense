'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Link from 'next/link';
import { IoIosNotificationsOutline } from 'react-icons/io';

interface HouseholdInvitation {
  id: string;
  household_id: string;
  invited_by: string;
  created_at: string;
  households: {
    name: string;
  };
  inviter: {
    username: string;
    email: string;
  };
}

interface RoomInvitation {
  id: string;
  room_id: string;
  invited_by: string;
  created_at: string;
  invited_household_id: string | null;
  rooms: {
    name: string;
    split_by: 'USER' | 'HOUSEHOLD';
  };
  inviter: {
    username: string;
    email: string;
  };
  households?: {
    name: string;
  };
}

export function InvitationsDropdown() {
  const supabase = createClient();
  const [householdInvitations, setHouseholdInvitations] = useState<HouseholdInvitation[]>([]);
  const [roomInvitations, setRoomInvitations] = useState<RoomInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInvitations();

    // Subscribe to realtime changes
    const householdChannel = supabase
      .channel('household_invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_invitations',
        },
        () => {
          loadInvitations();
        }
      )
      .subscribe();

    const roomChannel = supabase
      .channel('room_invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_invitations',
        },
        () => {
          loadInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(householdChannel);
      supabase.removeChannel(roomChannel);
    };
  }, []);

  const loadInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load household invitations
      const { data: householdData, error: householdError } = await supabase
        .from('household_invitations')
        .select(`
          id,
          household_id,
          invited_by,
          created_at,
          households:household_id (name),
          inviter:invited_by (username, email)
        `)
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (householdError) throw householdError;
      setHouseholdInvitations((householdData as any) || []);

      // Load room invitations (user invitations)
      const { data: roomUserData, error: roomUserError } = await supabase
        .from('room_invitations')
        .select(`
          id,
          room_id,
          invited_by,
          created_at,
          invited_household_id,
          rooms:room_id (name, split_by),
          inviter:invited_by (username, email)
        `)
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (roomUserError) {
        console.error('Room user invitations error:', roomUserError);
        throw roomUserError;
      }

      // Load room invitations (household invitations where user is owner)
      const { data: userHouseholds } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', user.id);

      // Filter only households where user is owner (case-insensitive)
      const householdIds = (userHouseholds || [])
        .filter((h: any) => h.role?.toLowerCase() === 'owner')
        .map((h: any) => h.household_id);

      let roomHouseholdData: any[] = [];
      if (householdIds.length > 0) {
        const { data, error: roomHouseholdError } = await supabase
          .from('room_invitations')
          .select(`
            id,
            room_id,
            invited_by,
            created_at,
            invited_household_id,
            rooms:room_id (name, split_by),
            inviter:invited_by (username, email),
            households:invited_household_id (name)
          `)
          .in('invited_household_id', householdIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (roomHouseholdError) {
          console.error('Room household invitations error:', roomHouseholdError);
          throw roomHouseholdError;
        }
        roomHouseholdData = (data as any) || [];
      }

      setRoomInvitations([...(roomUserData as any) || [], ...roomHouseholdData]);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const handleAcceptHousehold = async (invitationId: string, householdId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Add user to household
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: householdId,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) throw memberError;

      // Update invitation status
      const { error: inviteError } = await supabase
        .from('household_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (inviteError) throw inviteError;

      toast.success('✅ Đã tham gia hộ gia đình!');
      loadInvitations();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectHousehold = async (invitationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('household_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('✅ Đã từ chối lời mời');
      loadInvitations();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRoom = async (invitationId: string) => {
    setLoading(true);
    try {
      // Update invitation status (trigger will auto-add to room_members)
      const { error } = await supabase
        .from('room_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('✅ Đã tham gia không gian!');
      loadInvitations();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRoom = async (invitationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('room_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('✅ Đã từ chối lời mời');
      loadInvitations();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative hover:bg-white/20 p-3">
          <IoIosNotificationsOutline className="w-7 h-7 text-white" />
          {(householdInvitations.length + roomInvitations.length) > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {householdInvitations.length + roomInvitations.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <p className="font-semibold text-sm mb-2">Lời mời</p>
          {householdInvitations.length === 0 && roomInvitations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Không có lời mời nào
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Household Invitations */}
              {householdInvitations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Hộ gia đình</p>
                  {householdInvitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 border rounded-lg space-y-2 bg-white"
                    >
                      <p className="text-sm">
                        <span className="font-medium">{inv.inviter.username || inv.inviter.email}</span>
                        {' '}mời bạn tham gia hộ{' '}
                        <span className="font-medium text-green-600">{inv.households.name}</span>
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptHousehold(inv.id, inv.household_id)}
                          disabled={loading}
                          className="flex-1"
                        >
                          Chấp nhận
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectHousehold(inv.id)}
                          disabled={loading}
                          className="flex-1"
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Room Invitations */}
              {roomInvitations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Không gian</p>
                  {roomInvitations.filter(inv => inv.rooms).map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 border rounded-lg space-y-2 bg-white"
                    >
                      <p className="text-sm">
                        <span className="font-medium">{inv.inviter?.username || inv.inviter?.email}</span>
                        {' '}mời {inv.invited_household_id ? (
                          <>hộ <span className="font-medium text-blue-600">{inv.households?.name}</span></>
                        ) : 'bạn'} tham gia không gian{' '}
                        <span className="font-medium text-green-600">{inv.rooms?.name || 'Không gian'}</span>
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRoom(inv.id)}
                          disabled={loading}
                          className="flex-1"
                        >
                          Chấp nhận
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRoom(inv.id)}
                          disabled={loading}
                          className="flex-1"
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

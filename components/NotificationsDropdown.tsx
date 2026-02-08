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
import { Bell, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'settlement';
  link: string | null;
  is_read: boolean;
  created_at: string;
}

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

export function NotificationsDropdown() {
  const supabase = createClient();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [householdInvitations, setHouseholdInvitations] = useState<HouseholdInvitation[]>([]);
  const [roomInvitations, setRoomInvitations] = useState<RoomInvitation[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const totalUnread = notifications.filter(n => !n.is_read).length + householdInvitations.length + roomInvitations.length;

  useEffect(() => {
    loadAllData();

    // Subscribe to notifications
    const notifChannel = supabase
      .channel('notifications_merge_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, loadNotifications)
      .subscribe();

    // Subscribe to invitations
    const householdChannel = supabase
      .channel('household_invitations_merge_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'household_invitations' }, loadInvitations)
      .subscribe();

    const roomChannel = supabase
      .channel('room_invitations_merge_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_invitations' }, loadInvitations)
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(householdChannel);
      supabase.removeChannel(roomChannel);
    };
  }, []);

  const loadAllData = () => {
    loadNotifications();
    loadInvitations();
  };

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications((data as Notification[]) || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load household invitations
      const { data: householdData, error: householdError } = await supabase
        .from('household_invitations')
        .select(`
          id, household_id, invited_by, created_at,
          households:household_id (name),
          inviter:invited_by (username, email)
        `)
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!householdError) setHouseholdInvitations((householdData as any) || []);

      // Load room invitations (direct user)
      const { data: roomUserData, error: roomUserError } = await supabase
        .from('room_invitations')
        .select(`
          id, room_id, invited_by, created_at, invited_household_id,
          rooms:room_id (name, split_by),
          inviter:invited_by (username, email)
        `)
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Load room invitations (via household ownership)
      const { data: userHouseholds } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', user.id);

      const ownerHouseholdIds = (userHouseholds || [])
        .filter((h: any) => h.role?.toLowerCase() === 'owner')
        .map((h: any) => h.household_id);

      let roomHouseholdData: any[] = [];
      if (ownerHouseholdIds.length > 0) {
        const { data } = await supabase
          .from('room_invitations')
          .select(`
            id, room_id, invited_by, created_at, invited_household_id,
            rooms:room_id (name, split_by),
            inviter:invited_by (username, email),
            households:invited_household_id (name)
          `)
          .in('invited_household_id', ownerHouseholdIds)
          .eq('status', 'pending');
        
        roomHouseholdData = data || [];
      }

      const allRoomInvites = [...(roomUserData as any || []), ...roomHouseholdData];
      // Remove duplicates just in case
      const uniqueRoomInvites = Array.from(new Map(allRoomInvites.map(item => [item.id, item])).values());
      
      setRoomInvitations(uniqueRoomInvites as RoomInvitation[]);

    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const handleAcceptHousehold = async (invitationId: string, householdId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: memberError } = await supabase
        .from('household_members')
        .insert({ household_id: householdId, user_id: user.id, role: 'member' });
      if (memberError) throw memberError;

      const { error: inviteError } = await supabase
        .from('household_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);
      if (inviteError) throw inviteError;

      toast.success('Đã tham gia hộ gia đình!');
      loadInvitations();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
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
      toast.success('Đã từ chối lời mời');
      loadInvitations();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRoom = async (invitationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('room_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);
      if (error) throw error;
      toast.success('Đã tham gia không gian!');
      loadInvitations();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
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
      toast.success('Đã từ chối lời mời');
      loadInvitations();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);
        
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
      }

      if (notification.link) {
        router.push(notification.link);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const hasInvitations = householdInvitations.length > 0 || roomInvitations.length > 0;
  const hasNotifications = notifications.length > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative w-10 h-10 rounded-xl hover:bg-white/20 transition-all duration-300 tap-highlight"
        >
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          {totalUnread > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primary animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 rounded-2xl overflow-hidden shadow-xl border-gray-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Thông báo</h3>
          {totalUnread > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 py-1 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 font-semibold"
              onClick={handleMarkAllAsRead}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {!hasInvitations && !hasNotifications ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2">
              <Bell className="w-8 h-8 text-gray-300" />
              <p className="text-sm">Không có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {/* Invitations Section */}
              {hasInvitations && (
                <div className="bg-blue-50/30">
                  <div className="px-4 py-2 bg-blue-50/50 border-b border-blue-100/50">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Lời mời</p>
                  </div>
                  
                  {/* Household Invitations */}
                  {householdInvitations.map((inv) => (
                    <div key={inv.id} className="p-4 border-b border-blue-100/30 hover:bg-blue-50/50 transition-colors">
                      <p className="text-sm text-gray-900 mb-3">
                        <span className="font-bold">{inv.inviter.username || inv.inviter.email}</span>
                        {' '}mời bạn tham gia hộ{' '}
                        <span className="font-bold text-blue-600">{inv.households.name}</span>
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptHousehold(inv.id, inv.household_id)}
                          disabled={loading}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 h-8 text-xs font-bold"
                        >
                          Chấp nhận
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectHousehold(inv.id)}
                          disabled={loading}
                          className="flex-1 h-8 text-xs font-bold"
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Room Invitations */}
                  {roomInvitations.map((inv) => (
                    <div key={inv.id} className="p-4 border-b border-blue-100/30 hover:bg-blue-50/50 transition-colors">
                      <p className="text-sm text-gray-900 mb-3">
                        <span className="font-bold">{inv.inviter?.username || inv.inviter?.email}</span>
                        {' '}mời {inv.invited_household_id ? (
                          <>hộ <span className="font-bold text-blue-600">{inv.households?.name}</span></>
                        ) : 'bạn'} tham gia không gian{' '}
                        <span className="font-bold text-green-600">{inv.rooms?.name}</span>
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRoom(inv.id)}
                          disabled={loading}
                          className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-xs font-bold"
                        >
                          Chấp nhận
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRoom(inv.id)}
                          disabled={loading}
                          className="flex-1 h-8 text-xs font-bold"
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notifications Section */}
              {hasNotifications && (
                <div>
                  {hasInvitations && (
                     <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thông báo khác</p>
                    </div>
                  )}
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className={cn(
                        "w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-3 items-start",
                        !notification.is_read && "bg-white"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2 shrink-0 transition-colors",
                         !notification.is_read ? "bg-red-500" : "bg-transparent"
                      )} />
                      <div className="flex-1 space-y-1">
                        <p className={cn(
                          "text-sm text-gray-900 leading-snug",
                          !notification.is_read ? "font-bold" : "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    </button>
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

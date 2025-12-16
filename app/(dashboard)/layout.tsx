import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { Toaster } from '@/components/ui/sonner';
import { RoomProvider } from '@/contexts/RoomContext';

// Cache user profile to avoid refetching on every navigation
const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return profile;
});

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile with caching
  const profile = await getProfile(user.id);

  return (
    <RoomProvider>
      <div className="min-h-screen bg-transparent">
        <DashboardShell user={user} profile={profile}>
          {children}
        </DashboardShell>
        
        <Toaster />
      </div>
    </RoomProvider>
  );
}

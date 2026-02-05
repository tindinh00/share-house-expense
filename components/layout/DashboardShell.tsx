'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface DashboardShellProps {
  user: User;
  profile: {
    username?: string;
  } | null;
  children: React.ReactNode;
}

export default function DashboardShell({ user, profile, children }: DashboardShellProps) {
  // Initialize sidebar state based on screen size and localStorage
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isMobile = window.innerWidth < 768;
    if (isMobile) return false;
    const saved = localStorage.getItem('sidebarOpen');
    return saved === 'true';
  });

  // Save sidebar state to localStorage whenever it changes
  const toggleSidebar = (newState: boolean) => {
    setIsSidebarOpen(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', String(newState));
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Premium background applied globally */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] bg-primary overflow-hidden -z-10 bg-gradient-to-br from-emerald-600 via-primary to-green-500">
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-background rounded-t-[48px] -mb-1"></div>
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-[20%] left-[-5%] w-48 h-48 bg-white/5 rounded-full blur-2xl delay-700" />
      </div>

      <Header 
        user={user} 
        profile={profile}
        onMenuClick={() => toggleSidebar(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      <div className="flex flex-1 relative">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => toggleSidebar(false)}
          onToggle={() => toggleSidebar(!isSidebarOpen)}
        />
        
        <main className={`flex-1 min-w-0 p-4 md:p-6 lg:p-8 pb-32 md:pb-12 transition-all duration-500 ease-in-out w-full ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
      
      <BottomNav />
    </div>
  );
}

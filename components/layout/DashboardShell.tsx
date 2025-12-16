'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface DashboardShellProps {
  user: User;
  profile: any;
  children: React.ReactNode;
}

export default function DashboardShell({ user, profile, children }: DashboardShellProps) {
  // Start with false on mobile, true on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Check if mobile
    const isMobile = window.innerWidth < 768;
    
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      // On mobile, always start closed
      setIsSidebarOpen(isMobile ? false : saved === 'true');
    } else {
      // Default: closed on mobile, open on desktop
      setIsSidebarOpen(!isMobile);
    }
  }, []);

  // Save sidebar state to localStorage whenever it changes
  const toggleSidebar = (newState: boolean) => {
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', String(newState));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        user={user} 
        profile={profile}
        onMenuClick={() => toggleSidebar(!isSidebarOpen)}
      />
      
      <div className="flex flex-1">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => toggleSidebar(false)}
          onToggle={() => toggleSidebar(!isSidebarOpen)}
        />
        
        <main className={`flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-6 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      <BottomNav />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardShellProps {
  user: User;
  profile: any;
  children: React.ReactNode;
}

export default function DashboardShell({ user, profile, children }: DashboardShellProps) {
  // Start with true to match server render
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) {
      setIsSidebarOpen(saved === 'true');
    }
  }, []);

  // Save sidebar state to localStorage whenever it changes
  const toggleSidebar = (newState: boolean) => {
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', String(newState));
  };

  return (
    <>
      <Header 
        user={user} 
        profile={profile}
        onMenuClick={() => toggleSidebar(!isSidebarOpen)}
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => toggleSidebar(false)}
          onToggle={() => toggleSidebar(!isSidebarOpen)}
        />
        
        <main className={`flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

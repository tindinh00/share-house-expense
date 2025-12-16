'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function LoginToast({ username }: { username: string }) {
  const router = useRouter();
  
  useEffect(() => {
    toast.success(`🎉 Chào mừng ${username} quay lại!`, {
      duration: 3000,
    });
    
    setTimeout(() => {
      router.replace('/dashboard', { scroll: false });
    }, 100);
  }, [username, router]);

  return null;
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { initAuth, User } from '@/lib/firebaseAuth';
import { Shell } from '@/components/layout/Shell';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setLoading(false);
        if (pathname === '/login') {
          router.push('/');
        }
      },
      () => {
        setUser(null);
        setLoading(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    );
    return () => unsubscribe();
  }, [pathname, router]);

  // Force cache clearing each time it is started
  useEffect(() => {
    // Adding no-cache headers via fetch calls or clearing specific storages if needed
    // Setting a session storage flag so it only runs once per tab session
    const hasCleared = sessionStorage.getItem('@jc-eletricista:cache-cleared');
    if (!hasCleared) {
      sessionStorage.setItem('@jc-eletricista:cache-cleared', 'true');
      // They said "zerar o cachê". Let's clear nextjs router cache by refreshing
      router.refresh();
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF7A00] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-bold animate-pulse">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname === '/login') {
    return <>{children}</>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <Shell>{children}</Shell>;
}

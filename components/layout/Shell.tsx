'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, Menu, Search, Bell, HelpCircle, X } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Orçamentos', href: '/orcamentos', icon: FileText },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary selection:text-black">
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-[#1f1f23] flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo Section */}
        <div className="p-4 flex flex-col items-center relative border-b border-[#1a1a1e]">
           {mobileMenuOpen && (
              <button onClick={() => setMobileMenuOpen(false)} className="absolute top-3 right-3 md:hidden text-zinc-400 hover:text-white p-1">
                <X size={22} />
              </button>
           )}
          <div className="w-full">
            <Logo variant="full" className="w-full" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 p-4 flex-1 overflow-y-auto">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-1">Menu Principal</span>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-3 gap-3 rounded-lg border transition-all ${
                  isActive 
                    ? 'bg-[#141414] border-[#FF7A00]/40 text-[#FF7A00] font-bold shadow-sm shadow-[#FF7A00]/5' 
                    : 'border-transparent text-zinc-400 hover:bg-[#121212] hover:text-zinc-100 hover:border-zinc-800/80'
                }`}
              >
                <item.icon size={19} className={isActive ? 'text-[#FF7A00]' : 'text-zinc-400'} />
                <span className="text-xs font-semibold uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-[#1a1a1e] bg-[#070707]">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF7A00] animate-pulse"></span>
              Sistema Operacional
            </span>
            <span className="text-zinc-400 font-mono">v1.2</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#080808]">
        
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-[#0c0c0e] border-b border-[#1f1f23] px-4 md:px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-zinc-300 hover:text-[#FF7A00] transition-colors p-1" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="md:hidden">
              <Logo variant="compact" />
            </div>
            
            <div className="hidden md:flex relative items-center">
              <Search className="absolute left-3 text-zinc-400" size={17} />
              <input 
                type="text" 
                placeholder="Buscar clientes, orçamentos..." 
                className="w-[320px] bg-[#121214] border border-[#27272a] text-zinc-100 text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00] transition-all placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button className="text-zinc-400 hover:text-[#FF7A00] p-2 rounded-lg hover:bg-[#18181b] transition-colors relative">
              <Bell size={19} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF7A00] rounded-full"></span>
            </button>
            <Link href="/configuracoes" className="text-zinc-400 hover:text-[#FF7A00] p-2 rounded-lg hover:bg-[#18181b] transition-colors">
              <Settings size={19} />
            </Link>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#080808] p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

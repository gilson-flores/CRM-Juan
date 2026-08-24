'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Users, FileText, Settings, Plus, Menu, Search, Bell, HelpCircle, X, User } from 'lucide-react';

const LOGO_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqMADY-_jdfjYrWyz4D_a3jQzcmtfqfZOpLUyaOuDT4QB4eP8D0taHh-XwMIjoJsiNK9_06fPx4ejHrXVQPcaw5XYaPKb12nAoMyDeNXHjlItLkgM03RYlovC1PgEsaGiS4ucITdw8i1v0OxZXUa32QljxvKNNv3Oj408enJMl_vx4u0svFmDIYdAkJdSskM1ouk_AdkazkCc0BSqIV9ygkPlX5oMgg1QJt6AmunBqxBQ_gfOSAGUkYhgDeS8iH7Tbww';
const AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNIYs8RR49RttgdPHd2vSmJx-zve3Kkae9-_bneknT02sWAthqjjYMDj-gHjgvkhTG1EAHObcLRpUk1vDKL_UdVQbpW9NxtaLbA7feEvu1y3tSemGIWPEgYJ3oYJvEHR4cVNuP-PgyJZ6RdbmUH9qMuwx1OjOPAgUyLpKBQxEgf_fk2lvoiBkMc1wcuwHfeyPiSEHM6D2X-2Mj4IMem1hLgi6exHSWaafhABJwHkATyosBFQVcY-yf';

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
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-container border-r border-outline-variant flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-md py-md mb-md flex flex-col items-center relative">
           {mobileMenuOpen && (
              <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 md:hidden text-on-surface-variant hover:text-on-surface">
                <X size={24} />
              </button>
           )}
          <div className="relative w-48 h-24 mb-2">
            <Image src="/logo.jpg" alt="JC Eletricista" fill className="object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>

        <div className="px-md mb-6">
          <Link href="/clientes" className="w-full bg-primary text-on-primary text-xs font-semibold py-3 rounded flex items-center justify-center gap-2 hover:bg-primary-container transition-colors uppercase tracking-wider shadow-sm">
            <Plus size={16} />
            Novo Cadastro
          </Link>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} className={`flex items-center px-4 py-3 gap-3 rounded-r-md border-l-4 transition-colors ${isActive ? 'bg-surface-container-highest border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}>
                <item.icon size={20} className={isActive ? 'text-primary' : 'text-on-surface-variant'} />
                <span className="text-xs font-semibold uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-surface border-b border-outline-variant px-4 md:px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-on-surface hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="md:hidden text-lg font-bold text-primary uppercase tracking-wider">JC Eletricista</div>
            
            <div className="hidden md:flex relative items-center">
              <Search className="absolute left-3 text-on-surface-variant" size={18} />
              <input 
                type="text" 
                placeholder="Buscar clientes, orçamentos..." 
                className="w-[300px] bg-surface-container border border-outline-variant text-on-surface text-sm rounded pl-10 pr-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-high transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <button className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-high transition-colors">
              <HelpCircle size={20} />
            </button>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

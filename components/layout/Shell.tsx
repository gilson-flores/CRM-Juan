'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, Menu, User, X, Wrench, CheckSquare, LogIn, AlertCircle, Lock } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { AdminDiagnosticBar } from '@/components/AdminDiagnosticBar';
import { motion, AnimatePresence } from 'motion/react';

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mainScrollRef = useRef<HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, authLoading, loginWithEmail, registerWithEmail, logout, companySettings } = useFirebaseData();
  
  // Auto-scroll to top on route change
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname]);
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Orçamentos', href: '/orcamentos', icon: FileText },
    { name: 'Ordens de Serviço', href: '/pedidos', icon: CheckSquare },
    { name: 'Catálogo', href: '/catalogo', icon: Wrench },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoadingAuth(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email.trim(), password);
      } else {
        // Verifica se o administrador autorizou novos cadastros
        if (companySettings && companySettings.allowRegistrations === false) {
          setAuthError('Novos cadastros estão temporariamente suspensos pelo administrador do sistema.');
          setIsLoadingAuth(false);
          return;
        }
        await registerWithEmail(email.trim(), password, name.trim() || 'Usuário');
      }
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setAuthError('E-mail ou senha incorretos. Se ainda não cadastrou este e-mail neste ambiente, clique em "Criar nova conta".');
      } else if (code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já possui uma conta criada. Clique em "Já tenho conta" para entrar.');
      } else if (code === 'auth/weak-password') {
        setAuthError('A senha deve conter no mínimo 6 caracteres.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('O formato do e-mail inserido é inválido.');
      } else if (code === 'auth/api-key-not-valid' || code.includes('api-key-not-valid')) {
        setAuthError('Chave de API do Firebase inválida. Verifique as credenciais do projeto.');
      } else if (code === 'auth/network-request-failed') {
        setAuthError('Falha de conexão com os serviços de autenticação. Verifique sua conexão com a internet e tente novamente.');
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError('O login por e-mail e senha não está habilitado no console do Firebase.');
      } else {
        setAuthError('Erro na autenticação: ' + (err.message || 'Verifique seus dados e tente novamente.'));
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080808]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF7A00] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#080808] flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-[#0e0e11] border border-[#222226] rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="flex justify-center mb-6">
            <Logo variant="compact" size="lg" />
          </div>
          
          <h1 className="text-xl font-bold text-center text-white mb-1.5">CRM JC Eletricista</h1>
          <p className="text-xs text-center text-zinc-400 mb-6">Entre para gerenciar seus orçamentos e clientes.</p>

          <div className="grid grid-cols-2 gap-2 mb-6 bg-[#141418] p-1 rounded-xl border border-[#222228]">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`w-full text-xs font-bold py-2.5 rounded-lg transition-all text-center cursor-pointer ${authMode === 'login' ? 'bg-[#222228] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Já tenho conta
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              className={`w-full text-xs font-bold py-2.5 rounded-lg transition-all text-center cursor-pointer ${authMode === 'register' ? 'bg-[#222228] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Criar nova conta
            </button>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 text-left">
              <AlertCircle size={15} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4 w-full">
            {authMode === 'register' && (
              <div className="w-full text-left">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Seu Nome</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full box-border bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00] transition-colors"
                  placeholder="Ex: Juan Carlos"
                />
              </div>
            )}
            <div className="w-full text-left">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full box-border bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00] transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <div className="w-full text-left">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full box-border bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00] transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingAuth}
              className="w-full bg-[#FF7A00] hover:bg-[#FF8A00] text-black text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md mt-6 disabled:opacity-50 cursor-pointer"
            >
              {isLoadingAuth ? (
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
              ) : (
                <LogIn size={16} />
              )}
              {authMode === 'login' ? 'Entrar no Sistema' : 'Criar Conta e Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
            const isActive = pathname === item.href || (item.href !== '/' && !!pathname && pathname.startsWith(item.href));
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
            
            {/* Nome do Usuário Logado */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#141418] border border-[#262630] flex items-center justify-center text-[#FF7A00] font-black text-xs shrink-0 shadow-sm">
                <User size={15} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight truncate max-w-[200px] sm:max-w-[320px]">
                  {user.displayName || companySettings?.ownerName || (user.email ? user.email.split('@')[0] : 'Usuário')}
                </span>
                <span className="text-[10px] text-zinc-400 truncate max-w-[200px] sm:max-w-[320px]">
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <Link 
              href="/configuracoes" 
              className="text-zinc-400 hover:text-[#FF7A00] p-2 rounded-lg hover:bg-[#18181b] transition-colors flex items-center gap-1.5"
              title="Configurações"
            >
              <Settings size={19} />
            </Link>
            <button
              onClick={() => logout()}
              className="text-xs font-bold text-zinc-400 hover:text-red-400 bg-[#141418] hover:bg-[#1f1a1d] border border-[#222228] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Encerrar Sessão"
            >
              Sair
            </button>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <main ref={mainScrollRef} id="main-content-scroll" className="flex-1 overflow-y-auto bg-[#080808] p-4 md:p-6 lg:p-8 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto space-y-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Admin Diagnostic & Support Live Bar */}
      <AdminDiagnosticBar userEmail={user?.email} />
    </div>
  );
}

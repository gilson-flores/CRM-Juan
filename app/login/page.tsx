'use client';

import { useState } from 'react';
import { googleSignIn } from '@/lib/firebaseAuth';
import { Logo } from '@/components/Logo';
import { ShieldCheck, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await googleSignIn();
      // AuthProvider will detect the change and redirect
    } catch (err: any) {
      console.error(err);
      setError('Falha na autenticação. Verifique se os pop-ups estão liberados e tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-4">
      <div className="w-full max-w-md bg-[#0e0e11] border border-[#222226] rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl shadow-black">
        <Logo variant="full" className="w-48 mb-8" />
        
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 mb-8 w-full flex items-start gap-3 text-left">
          <ShieldCheck className="text-[#FF7A00] shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Acesso Restrito</h3>
            <p className="text-xs text-zinc-400">Faça login com sua conta do Google vinculada à planilha para acessar o CRM e sincronizar seus dados.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg w-full mb-6 text-left">
            {error}
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#FF7A00] hover:bg-[#FF8A00] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider text-sm px-4 py-4 rounded-xl transition-all shadow-lg shadow-[#FF7A00]/20"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={20} />
              Entrar com Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}

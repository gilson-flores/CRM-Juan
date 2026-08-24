'use client';

import { Settings, Cloud, CheckCircle, RefreshCcw } from 'lucide-react';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';

export default function ConfiguracoesPage() {
  const { login, token, spreadsheetId } = useGoogleSheets();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="p-4 bg-surface-container rounded-full mb-4 border border-outline-variant">
        <Settings size={48} className="text-primary opacity-50" />
      </div>
      <h1 className="text-2xl font-bold text-on-surface mb-2">Integrações</h1>
      <p className="text-on-surface-variant max-w-md mb-8">
        Faça login com o Google para habilitar a sincronização dos seus clientes e orçamentos na nuvem (Google Sheets).
      </p>
      
      <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col gap-4 items-center">
        <Cloud size={32} className="text-primary" />
        <h2 className="text-xl font-semibold text-on-surface">Google Sheets</h2>
        
        {!token ? (
          <button 
            onClick={login}
            className="mt-2 bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:bg-primary-container transition-colors shadow-lg"
          >
            Conectar Google Sheets
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle size={18} /> Conectado com Sucesso
            </span>
            {spreadsheetId && (
              <span className="text-xs text-on-surface-variant">
                ID da Planilha: {spreadsheetId.substring(0, 8)}...
              </span>
            )}
            <p className="text-sm text-on-surface-variant mt-2 max-w-sm">
              Seus dados agora podem ser sincronizados nas páginas de Clientes e Orçamentos usando os botões de nuvem.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

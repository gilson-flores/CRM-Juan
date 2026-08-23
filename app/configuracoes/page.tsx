'use client';

import { Settings } from 'lucide-react';

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="p-4 bg-surface-container rounded-full mb-4 border border-outline-variant">
        <Settings size={48} className="text-primary opacity-50" />
      </div>
      <h1 className="text-2xl font-bold text-on-surface mb-2">Configurações</h1>
      <p className="text-on-surface-variant max-w-md">Esta área está em desenvolvimento. Em breve você poderá ajustar preferências do sistema, dados da empresa e integrações.</p>
    </div>
  );
}

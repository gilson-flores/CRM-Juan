'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Users, FileText, DollarSign, ArchiveRestore } from 'lucide-react';
import Link from 'next/link';
import type { Client } from './clientes/page';

export default function DashboardPage() {
  const [totalClients, setTotalClients] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('@jc-eletricista:clients');
    if (saved) {
      try {
        const parsed: Client[] = JSON.parse(saved);
        const timeoutId = setTimeout(() => {
          setTotalClients(parsed.length);
        }, 0);
        return () => clearTimeout(timeoutId);
      } catch(e) {
        // ignore JSON parse error for empty state
      }
    }
  }, []);

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface">Visão Geral</h2>
          <p className="text-sm text-on-surface-variant mt-1">Acompanhamento de métricas e atividades recentes.</p>
        </div>
        <button className="bg-surface border border-primary text-primary px-4 py-2 rounded flex items-center gap-2 hover:bg-primary/10 transition-colors w-fit text-xs font-semibold uppercase tracking-wider">
          <CalendarDays size={18} />
          Últimos 30 Dias
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total de Clientes</span>
            <div className="p-2 rounded bg-surface-container">
              <Users className="text-primary" size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl font-bold text-on-surface">{totalClients}</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 flex flex-col gap-4 relative overflow-hidden group opacity-50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Orçamentos Pendentes</span>
            <div className="p-2 rounded bg-surface-container">
              <FileText className="text-primary" size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl font-bold text-on-surface">0</span>
            <span className="text-xs font-medium text-on-surface-variant">R$ 0,00 est.</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-6 flex flex-col gap-4 relative overflow-hidden group opacity-50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Receita (Mês)</span>
            <div className="p-2 rounded bg-surface-container">
              <DollarSign className="text-primary" size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl font-bold text-on-surface">R$ 0,00</span>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant rounded-lg flex flex-col overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h3 className="text-lg font-bold text-on-surface">Serviços Realizados</h3>
          </div>
          <div className="p-6 flex-grow flex items-center justify-center h-64 relative bg-surface-container-low text-on-surface-variant flex-col gap-2">
             <ArchiveRestore size={32} className="opacity-50" />
             <p className="text-sm">Nenhum serviço registrado neste período.</p>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-surface-container-low border border-outline-variant rounded-lg flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            <h3 className="text-lg font-bold text-on-surface">Atividades Recentes</h3>
          </div>
          <div className="flex flex-col flex-grow bg-surface-container-low items-center justify-center p-6 text-on-surface-variant text-sm text-center">
            Nenhuma atividade recente encontrada no sistema.
          </div>
          <div className="p-3 border-t border-outline-variant text-center mt-auto bg-surface-container-lowest">
            <Link href="/" className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider">Ver todo o histórico</Link>
          </div>
        </div>
      </div>
    </>
  );
}

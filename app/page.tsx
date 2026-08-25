'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Users, FileText, DollarSign, ArchiveRestore, ArrowUpRight, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import type { Client } from './clientes/page';

type DraftQuote = {
  id: string;
  clientName: string;
  total: number;
  date: string;
  itemsStr: string;
};

export default function DashboardPage() {
  const [totalClients, setTotalClients] = useState(0);
  const [drafts, setDrafts] = useState<DraftQuote[]>([]);
  const [totalEstimated, setTotalEstimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedClients = localStorage.getItem('@jc-eletricista:clients');
      const savedDrafts = localStorage.getItem('@jc-eletricista:drafts');
      
      if (savedClients) {
        try {
          const parsed: Client[] = JSON.parse(savedClients);
          setTotalClients(parsed.length);
        } catch(e) {}
      }

      if (savedDrafts) {
        try {
          const parsedDrafts: DraftQuote[] = JSON.parse(savedDrafts);
          setDrafts(parsedDrafts);
          const sum = parsedDrafts.reduce((acc, cur) => acc + (Number(cur.total) || 0), 0);
          setTotalEstimated(sum);
        } catch(e) {}
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Painel Principal</h2>
          <p className="text-xs text-zinc-400 mt-1">Acompanhamento de clientes, orçamentos e atividades em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/orcamentos" 
            className="bg-[#FF7A00] hover:bg-[#FF8A00] text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#FF7A00]/20"
          >
            <Plus size={16} className="stroke-[3]" />
            Novo Orçamento
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Total Clientes */}
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-[#FF7A00]/40 transition-all shadow-lg shadow-black/40">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#FF7A00]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Base de Clientes</span>
            <div className="p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[#FF7A00]">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-4xl font-black text-white">{totalClients}</span>
            <span className="text-xs text-zinc-400">cadastrados</span>
          </div>
        </div>

        {/* Orçamentos Registrados */}
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-[#FF7A00]/40 transition-all shadow-lg shadow-black/40">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#FF7A00]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Orçamentos Salvos</span>
            <div className="p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[#FF7A00]">
              <FileText size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-4xl font-black text-white">{drafts.length}</span>
            <span className="text-xs text-[#FF7A00] font-medium">
              R$ {totalEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} est.
            </span>
          </div>
        </div>

        {/* Volume Total Estimado */}
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-[#FF7A00]/40 transition-all shadow-lg shadow-black/40">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#FF7A00]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Previsão em Propostas</span>
            <div className="p-2.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[#FF7A00]">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl font-black text-white">
              R$ {totalEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recents List */}
        <div className="lg:col-span-2 bg-[#0e0e11] border border-[#222226] rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/40">
          <div className="p-5 border-b border-[#1f1f23] flex justify-between items-center bg-[#0a0a0c]">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText size={18} className="text-[#FF7A00]" />
              Últimos Orçamentos Gerados
            </h3>
            <Link href="/orcamentos" className="text-xs font-bold text-[#FF7A00] hover:underline uppercase tracking-wider flex items-center gap-1">
              Gerar Novo <ArrowUpRight size={14} />
            </Link>
          </div>
          
          <div className="p-4 flex-grow bg-[#0e0e11]">
            {drafts.length > 0 ? (
              <div className="divide-y divide-[#1f1f23]">
                {drafts.slice(0, 5).map((d) => (
                  <div key={d.id} className="py-3.5 px-2 flex items-center justify-between hover:bg-[#141418] rounded-lg transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-zinc-100">{d.clientName}</span>
                      <span className="text-xs text-zinc-400 truncate max-w-[280px] md:max-w-md">{d.itemsStr}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-[#FF7A00]">
                        R$ {Number(d.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-zinc-400">{d.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-zinc-400 flex-col gap-2">
                <ArchiveRestore size={36} className="text-zinc-600" />
                <p className="text-xs">Nenhum orçamento salvo ainda. Vá para a aba &quot;Orçamentos&quot; para criar o primeiro!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Help & Contact info Card */}
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl flex flex-col h-full overflow-hidden shadow-lg shadow-black/40">
          <div className="p-5 border-b border-[#1f1f23] flex justify-between items-center bg-[#0a0a0c]">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Acesso Rápido</h3>
          </div>
          <div className="flex flex-col flex-grow p-5 text-zinc-300 text-xs space-y-4">
            <div className="p-4 rounded-lg bg-[#141418] border border-[#242429]">
              <p className="font-bold text-white mb-1">JC Eletricista Joinville</p>
              <p className="text-zinc-400 text-[11px]">Instalações e manutenções elétricas residenciais e comerciais com máxima segurança e padrão técnico.</p>
            </div>

            <div className="flex flex-col gap-2 text-[11px] text-zinc-400">
              <div className="flex justify-between py-1.5 border-b border-[#1f1f23]">
                <span>WhatsApp Comercial:</span>
                <span className="text-white font-mono font-bold">(47) 99706-4183</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1f1f23]">
                <span>Instagram:</span>
                <span className="text-[#FF7A00] font-bold">@jc_eletricistajoinville</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Armazenamento:</span>
                <span className="text-emerald-400 font-bold">Google Sheets / Nuvem</span>
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-[#1f1f23] text-center bg-[#0a0a0c]">
            <Link href="/clientes" className="text-xs font-bold text-[#FF7A00] hover:underline uppercase tracking-wider">
              Gerenciar Clientes
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

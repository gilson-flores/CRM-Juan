'use client';

import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Users, FileText, DollarSign, ArchiveRestore, ArrowUpRight, Plus, Eye, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { Client } from './clientes/page';
import type { FullDraft } from './orcamentos/page';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function DashboardPage() {
  const [totalClients, setTotalClients] = useState(0);
  const [quotes, setQuotes] = useState<FullDraft[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    const savedClients = localStorage.getItem('@jc-eletricista:clients');
    const savedQuotes = localStorage.getItem('@jc-eletricista:saved_drafts_v2');
    
    if (savedClients) {
      try {
        const parsed: Client[] = JSON.parse(savedClients);
        setTotalClients(parsed.length);
      } catch(e) {}
    }

    if (savedQuotes) {
      try {
        const parsedQuotes: FullDraft[] = JSON.parse(savedQuotes);
        setQuotes(parsedQuotes);
      } catch(e) {}
    }
  }, []);

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Filtering data based on timeRange
  const filteredQuotes = useMemo(() => {
    if (timeRange === 'all') return quotes;
    
    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    return quotes.filter(q => {
      if (!q.date) return false;
      const [day, month, year] = q.date.split('/');
      const qDate = new Date(Number(year), Number(month) - 1, Number(day));
      const diff = (now.getTime() - qDate.getTime()) / msInDay;
      return diff <= days;
    });
  }, [quotes, timeRange]);

  // Aggregate data for charts
  const chartData = useMemo(() => {
    const dataByDate: Record<string, { enviados: number; rascunhos: number; date: string }> = {};
    
    filteredQuotes.forEach(q => {
      const d = q.date || 'Desconhecido';
      if (!dataByDate[d]) {
        dataByDate[d] = { date: d.substring(0, 5), enviados: 0, rascunhos: 0 };
      }
      if (q.status === 'enviado' || q.status === 'pedido' || q.status === 'concluido') {
        dataByDate[d].enviados += q.total || 0;
      } else {
        dataByDate[d].rascunhos += q.total || 0;
      }
    });

    return Object.values(dataByDate).reverse();
  }, [filteredQuotes]);

  const stats = useMemo(() => {
    let enviadosTotal = 0;
    let rascunhosTotal = 0;
    let enviadosCount = 0;
    
    filteredQuotes.forEach(q => {
      if (q.status === 'enviado' || q.status === 'pedido' || q.status === 'concluido') {
        enviadosTotal += q.total || 0;
        enviadosCount++;
      } else {
        rascunhosTotal += q.total || 0;
      }
    });

    return {
      totalEstimated: enviadosTotal + rascunhosTotal,
      enviadosTotal,
      rascunhosTotal,
      enviadosCount,
      rascunhosCount: filteredQuotes.length - enviadosCount,
    };
  }, [filteredQuotes]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Painel Principal</h2>
          <p className="text-xs text-zinc-400 mt-1">Acompanhamento de clientes, orçamentos e pedidos em tempo real.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={timeRange} 
            onChange={e => setTimeRange(e.target.value as any)}
            className="bg-[#141418] border border-[#222226] text-white px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:border-[#FF7A00]"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="all">Todo o período</option>
          </select>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        {/* Total Clientes */}
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group hover:border-[#FF7A00]/40 transition-all shadow-lg shadow-black/40">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Clientes</span>
            <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-[#FF7A00]">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl font-black text-white">{totalClients}</span>
          </div>
        </div>

        {/* Orçamentos Enviados */}
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group hover:border-[#FF7A00]/40 transition-all shadow-lg shadow-black/40">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Orç. Feitos (Env)</span>
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-900/50 text-emerald-400">
              <FileText size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl font-black text-white">{stats.enviadosCount}</span>
            <span className="text-xs text-emerald-400 font-medium">
              R$ {formatCurrency(stats.enviadosTotal)}
            </span>
          </div>
        </div>
        
        {/* Rascunhos / Não Enviados */}
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group hover:border-[#FF7A00]/40 transition-all shadow-lg shadow-black/40">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Rascunhos (Não Env)</span>
            <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400">
              <ArchiveRestore size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-3xl font-black text-white">{stats.rascunhosCount}</span>
            <span className="text-xs text-zinc-400 font-medium">
              R$ {formatCurrency(stats.rascunhosTotal)}
            </span>
          </div>
        </div>

        {/* Volume Total */}
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group hover:border-[#FF7A00]/40 transition-all shadow-lg shadow-black/40">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-widest">Volume Geral</span>
            <div className="p-2 rounded-lg bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00]">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 z-10">
            <span className="text-2xl font-black text-white truncate" title={`R$ ${formatCurrency(stats.totalEstimated)}`}>
              R$ {formatCurrency(stats.totalEstimated)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts Area */}
        <div className="lg:col-span-2 bg-[#0e0e11] border border-[#222226] rounded-xl flex flex-col overflow-hidden shadow-lg shadow-black/40">
          <div className="p-5 border-b border-[#1f1f23] flex justify-between items-center bg-[#0a0a0c]">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={18} className="text-[#FF7A00]" />
              Volume de Orçamentos (R$)
            </h3>
          </div>
          <div className="p-5 flex-grow bg-[#0e0e11] min-h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222226" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value >= 1000 ? (value/1000).toFixed(1)+'k' : value}`} />
                  <Tooltip 
                    cursor={{fill: '#18181b'}}
                    contentStyle={{ backgroundColor: '#141418', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: any) => [`R$ ${formatCurrency(value)}`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="enviados" name="Enviados / Pedidos" stackId="a" fill="#34d399" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="rascunhos" name="Rascunhos (Não enviados)" stackId="a" fill="#52525b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
                Não há dados suficientes no período selecionado.
              </div>
            )}
          </div>
        </div>

        {/* Recents List */}
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl flex flex-col h-full overflow-hidden shadow-lg shadow-black/40">
          <div className="p-5 border-b border-[#1f1f23] flex justify-between items-center bg-[#0a0a0c]">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Últimas Movimentações
            </h3>
          </div>
          <div className="p-4 flex-grow bg-[#0e0e11] overflow-y-auto max-h-[300px]">
            {filteredQuotes.length > 0 ? (
              <div className="divide-y divide-[#1f1f23]">
                {filteredQuotes.slice(0, 6).map((q) => (
                  <div key={q.id} className="py-3 flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="font-bold text-[13px] text-zinc-100">{q.clientName}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          q.status === 'pedido' || q.status === 'concluido' ? 'bg-emerald-500/10 text-emerald-400' :
                          q.status === 'enviado' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {q.status || 'rascunho'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">#{q.quoteNumber}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[13px] font-black text-[#FF7A00] font-mono">
                        R$ {formatCurrency(q.total)}
                      </span>
                      <span className="text-[10px] text-zinc-500">{q.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-zinc-500 text-xs text-center px-4">
                Nenhum registro encontrado no período.
              </div>
            )}
          </div>
          <div className="p-3 border-t border-[#1f1f23] text-center bg-[#0a0a0c]">
            <Link href="/pedidos" className="text-xs font-bold text-[#FF7A00] hover:underline uppercase tracking-wider">
              Ir para Pedidos <ArrowUpRight size={14} className="inline" />
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}

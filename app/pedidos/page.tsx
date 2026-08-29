'use client';
import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Clock, ArrowRight, Search, FileText, CheckSquare, Trash2, Calendar, TrendingUp } from 'lucide-react';
import type { FullDraft } from '../orcamentos/page';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';

export default function PedidosPage() {
  const [quotes, setQuotes] = useState<FullDraft[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const { syncAllData } = useGoogleSheets();

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('@jc-eletricista:saved_drafts_v2');
      if (saved) {
        try {
          setQuotes(JSON.parse(saved));
        } catch (e) {}
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTransformToOrder = () => {
    if (!selectedQuoteId) return;
    const updatedQuotes = quotes.map(q => 
      q.id === selectedQuoteId ? { ...q, status: 'pedido' as const } : q
    );
    setQuotes(updatedQuotes);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));
    setSelectedQuoteId('');
    showNotification('Orçamento transformado em pedido com sucesso!');
    syncAllData().catch(e => console.error('Sync failed', e));
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm('Deseja excluir este pedido? Ele será removido permanentemente.')) {
      const updatedQuotes = quotes.filter(q => q.id !== id);
      setQuotes(updatedQuotes);
      localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));
      showNotification('Pedido excluído.', 'info');
      syncAllData().catch(e => console.error('Sync failed', e));
    }
  };

  const handleMarkAsCompleted = (id: string) => {
    const updatedQuotes = quotes.map(q => 
      q.id === id ? { ...q, status: 'concluido' as const } : q
    );
    setQuotes(updatedQuotes);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));
    showNotification('Serviço marcado como concluído!', 'success');
    syncAllData().catch(e => console.error('Sync failed', e));
  };

  const handleRevertToOrder = (id: string) => {
    const updatedQuotes = quotes.map(q => 
      q.id === id ? { ...q, status: 'pedido' as const } : q
    );
    setQuotes(updatedQuotes);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));
    showNotification('Status revertido para Em Andamento', 'info');
    syncAllData().catch(e => console.error('Sync failed', e));
  };

  const availableQuotes = quotes.filter(q => q.status === 'enviado' || !q.status || q.status === 'rascunho');
  const activeOrders = quotes.filter(q => q.status === 'pedido');
  const completedOrders = quotes.filter(q => q.status === 'concluido');

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const stats = useMemo(() => {
    const totalActive = activeOrders.reduce((acc, q) => acc + (q.total || 0), 0);
    const totalCompleted = completedOrders.reduce((acc, q) => acc + (q.total || 0), 0);
    return { totalActive, totalCompleted, countActive: activeOrders.length, countCompleted: completedOrders.length };
  }, [activeOrders, completedOrders]);

  return (
    <>
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold ${
            notification.type === 'success' ? 'bg-[#141418] border-emerald-500/50 text-emerald-400' :
            notification.type === 'error' ? 'bg-[#141418] border-red-500/50 text-red-400' :
            'bg-[#141418] border-[#FF7A00]/50 text-[#FF7A00]'
          }`}>
            <CheckCircle size={16} />
            <span>{notification.text}</span>
          </div>
        </div>
      )}

      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Gestão de Pedidos</h1>
          <p className="text-xs text-zinc-400 mt-1">Transforme orçamentos aprovados em serviços ativos e gerencie as entregas.</p>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12}/> Em Andamento</span>
            <span className="text-2xl font-black text-white">{stats.countActive}</span>
          </div>
          <div className="text-right flex flex-col gap-1">
            <span className="text-sm font-black text-blue-400">R$ {formatCurrency(stats.totalActive)}</span>
            <span className="text-[10px] text-zinc-500">Receita Esperada</span>
          </div>
        </div>
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle size={12}/> Concluídos</span>
            <span className="text-2xl font-black text-white">{stats.countCompleted}</span>
          </div>
          <div className="text-right flex flex-col gap-1">
            <span className="text-sm font-black text-emerald-400">R$ {formatCurrency(stats.totalCompleted)}</span>
            <span className="text-[10px] text-zinc-500">Receita Realizada</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Transform to Order Area */}
        <section className="lg:col-span-1 bg-[#0e0e11] rounded-xl border border-[#222226] p-5 shadow-lg shadow-black/40">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <CheckSquare className="text-[#FF7A00]" size={18} />
            Aprovar Orçamento
          </h2>
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Selecione o Orçamento Pendente</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select 
                className="w-full bg-[#141418] border border-[#27272a] rounded-lg py-3 pl-9 pr-3 text-xs text-zinc-200 focus:outline-none focus:border-[#FF7A00] appearance-none"
                value={selectedQuoteId}
                onChange={(e) => setSelectedQuoteId(e.target.value)}
              >
                <option value="">Buscar orçamentos enviados/rascunhos...</option>
                {availableQuotes.map(q => (
                  <option key={q.id} value={q.id}>#{q.quoteNumber} - {q.clientName} (R$ {formatCurrency(q.total)})</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleTransformToOrder}
              disabled={!selectedQuoteId}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF8A00] disabled:bg-[#18181b] disabled:text-zinc-600 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider text-xs px-4 py-3.5 rounded-xl transition-all shadow-lg shadow-[#FF7A00]/10"
            >
              Iniciar Serviço <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Orders Lists */}
        <section className="lg:col-span-2 space-y-6">
          
          {/* Active Orders List */}
          <div className="bg-[#0e0e11] rounded-xl border border-[#222226] p-5 shadow-lg shadow-black/40">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-400" size={18} />
              Serviços em Andamento
            </h2>
            
            <div className="space-y-3">
              {activeOrders.length > 0 ? (
                activeOrders.map(order => (
                  <div key={order.id} className="p-4 rounded-xl bg-[#141418] border border-[#27272a] hover:border-blue-500/30 flex flex-col sm:flex-row justify-between gap-4 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-bold text-white">{order.clientName}</h3>
                        <span className="bg-[#1f1f28] text-zinc-400 text-[10px] px-2 py-0.5 rounded font-mono">#{order.quoteNumber}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-2">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {order.date}</span>
                        <span className="flex items-center gap-1"><FileText size={12} /> {order.items.length} itens</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end justify-between gap-3 sm:gap-0 border-t sm:border-t-0 sm:border-l border-[#27272a] pt-3 sm:pt-0 sm:pl-4 shrink-0">
                      <span className="text-sm font-black text-[#FF7A00] font-mono">
                        R$ {formatCurrency(order.total)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleMarkAsCompleted(order.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <CheckCircle size={12} /> Concluir
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-[#27272a] transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 text-zinc-500 text-xs bg-[#141418] rounded-xl border border-dashed border-[#27272a]">
                  Nenhum serviço em andamento no momento.
                </div>
              )}
            </div>
          </div>

          {/* Completed Orders List */}
          {completedOrders.length > 0 && (
            <div className="bg-[#0e0e11] rounded-xl border border-[#222226] p-5 shadow-lg shadow-black/40">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 opacity-70">
                <CheckCircle className="text-emerald-400" size={18} />
                Serviços Concluídos
              </h2>
              
              <div className="space-y-3">
                {completedOrders.map(order => (
                  <div key={order.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-emerald-900/30 flex flex-col sm:flex-row justify-between gap-4 transition-all opacity-80 hover:opacity-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-bold text-white">{order.clientName}</h3>
                        <span className="bg-[#1f1f28] text-zinc-500 text-[10px] px-2 py-0.5 rounded font-mono">#{order.quoteNumber}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Concluído</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-2">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {order.date}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end justify-between gap-3 sm:gap-0 border-t sm:border-t-0 sm:border-l border-[#242429] pt-3 sm:pt-0 sm:pl-4 shrink-0">
                      <span className="text-sm font-bold text-zinc-400 font-mono">
                        R$ {formatCurrency(order.total)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleRevertToOrder(order.id)}
                          className="text-[10px] font-bold text-zinc-400 hover:text-blue-400 bg-[#18181b] hover:bg-[#27272a] px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Reverter para Andamento
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-[#27272a] transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      </div>
    </>
  );
}

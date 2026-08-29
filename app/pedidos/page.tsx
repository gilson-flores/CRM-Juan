'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Clock, ArrowRight, Search, FileText, CheckSquare, Trash2, Calendar } from 'lucide-react';
import type { FullDraft } from '../orcamentos/page';

export default function PedidosPage() {
  const [quotes, setQuotes] = useState<FullDraft[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('@jc-eletricista:saved_drafts_v2');
    if (saved) {
      try {
        setQuotes(JSON.parse(saved));
      } catch (e) {}
    }
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
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm('Deseja excluir este pedido?')) {
      const updatedQuotes = quotes.filter(q => q.id !== id);
      setQuotes(updatedQuotes);
      localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));
      showNotification('Pedido excluído.', 'info');
    }
  };

  const handleMarkAsCompleted = (id: string) => {
    const updatedQuotes = quotes.map(q => 
      q.id === id ? { ...q, status: 'concluido' as const } : q
    );
    setQuotes(updatedQuotes);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));
    showNotification('Pedido marcado como concluído!', 'success');
  };

  const availableQuotes = quotes.filter(q => q.status === 'enviado' || !q.status || q.status === 'rascunho');
  const activeOrders = quotes.filter(q => q.status === 'pedido' || q.status === 'concluido');

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Gestão de Pedidos</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Transforme orçamentos em pedidos e acompanhe o andamento dos serviços.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Transform to Order Area */}
        <section className="lg:col-span-1 bg-surface-container rounded border border-outline-variant p-5">
          <h2 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <CheckSquare className="text-primary" size={18} />
            Aprovar Orçamento
          </h2>
          <div className="flex flex-col gap-3">
            <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Selecione o Orçamento</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select 
                className="w-full bg-surface-container-high border border-outline-variant rounded py-2.5 pl-9 pr-3 text-xs text-on-surface focus:outline-none focus:border-primary appearance-none"
                value={selectedQuoteId}
                onChange={(e) => setSelectedQuoteId(e.target.value)}
              >
                <option value="">Buscar orçamento pendente...</option>
                {availableQuotes.map(q => (
                  <option key={q.id} value={q.id}>#{q.quoteNumber} - {q.clientName} (R$ {formatCurrency(q.total)})</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleTransformToOrder}
              disabled={!selectedQuoteId}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF8A00] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider text-xs px-4 py-3 rounded-lg transition-colors shadow-lg shadow-[#FF7A00]/10"
            >
              Transformar em Pedido <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Active Orders List */}
        <section className="lg:col-span-2 bg-surface-container rounded border border-outline-variant p-5">
          <h2 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <Clock className="text-primary" size={18} />
            Pedidos em Andamento
          </h2>
          
          <div className="space-y-3">
            {activeOrders.length > 0 ? (
              activeOrders.map(order => (
                <div key={order.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between gap-4 transition-all ${order.status === 'concluido' ? 'bg-[#0a0a0c] border-emerald-900/30' : 'bg-[#0e0e11] border-[#292930] hover:border-[#FF7A00]/40'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-bold text-white">{order.clientName}</h3>
                      <span className="bg-[#1f1f28] text-zinc-400 text-[10px] px-2 py-0.5 rounded font-mono">#{order.quoteNumber}</span>
                      {order.status === 'concluido' && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Concluído</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-2">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {order.date}</span>
                      <span className="flex items-center gap-1"><FileText size={12} /> {order.items.length} itens</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end justify-between gap-3 sm:gap-0 border-t sm:border-t-0 sm:border-l border-[#242429] pt-3 sm:pt-0 sm:pl-4 shrink-0">
                    <span className="text-sm font-black text-[#FF7A00] font-mono">
                      R$ {formatCurrency(order.total)}
                    </span>
                    <div className="flex items-center gap-2">
                      {order.status !== 'concluido' && (
                        <button 
                          onClick={() => handleMarkAsCompleted(order.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2 py-1.5 rounded transition-colors"
                        >
                          <CheckCircle size={12} /> Concluir
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-zinc-500 hover:text-red-400 p-1.5 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 text-zinc-500 text-xs bg-[#0e0e11] rounded-xl border border-dashed border-[#242429]">
                Nenhum pedido ativo no momento. Aprove orçamentos para iniciá-los.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

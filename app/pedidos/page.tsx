'use client';
import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Clock, ArrowRight, Search, FileText, CheckSquare, Trash2, Calendar, TrendingUp, FileDown, Printer, AlertTriangle, CreditCard, ShieldCheck } from 'lucide-react';
import type { FullDraft } from '../orcamentos/page';
import type { Client } from '../clientes/page';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { generateQuotePdf } from '@/lib/generatePdf';
import { db, saveQuoteToFirestore, deleteQuoteFromFirestore, DEFAULT_PAYMENT_METHODS } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { Portal } from '@/components/ui/Portal';

export default function PedidosPage() {
  const [quotes, setQuotes] = useState<FullDraft[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [registeredPaymentMethods, setRegisteredPaymentMethods] = useState<string[]>(DEFAULT_PAYMENT_METHODS);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(DEFAULT_PAYMENT_METHODS[0]);
  const [selectedValidityDays, setSelectedValidityDays] = useState<number>(15);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<FullDraft | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { syncAllData, isConnected } = useGoogleSheets();

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('@jc-eletricista:saved_drafts_v2');
      const savedClients = localStorage.getItem('@jc-eletricista:clients');
      const savedSettings = localStorage.getItem('@jc-eletricista:company_settings');

      if (saved) {
        try {
          setQuotes(JSON.parse(saved));
        } catch (e) {}
      }
      if (savedClients) {
        try {
          setClients(JSON.parse(savedClients));
        } catch (e) {}
      }
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.paymentMethods && Array.isArray(parsed.paymentMethods) && parsed.paymentMethods.length > 0) {
            setRegisteredPaymentMethods(parsed.paymentMethods);
            if (parsed.defaultPaymentMethod) {
              setSelectedPaymentMethod(parsed.defaultPaymentMethod);
            } else {
              setSelectedPaymentMethod(parsed.paymentMethods[0]);
            }
          }
          if (parsed.defaultValidityDays) {
            setSelectedValidityDays(Number(parsed.defaultValidityDays) || 15);
          }
        } catch (e) {}
      }
    }, 0);

    const unsubQuotes = onSnapshot(collection(db, 'quotes'), (snapshot) => {
      if (!snapshot.empty) {
        const list: FullDraft[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as FullDraft);
        });
        if (list.length > 0) {
          setQuotes(list);
          localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(list));
        }
      }
    }, (err) => console.warn('Firestore quotes listener:', err));

    return () => {
      clearTimeout(timer);
      unsubQuotes();
    };
  }, []);

  // When selected quote changes, adopt its payment method and validity if set
  useEffect(() => {
    if (selectedQuoteId) {
      const quote = quotes.find(q => q.id === selectedQuoteId);
      if (quote) {
        if (quote.paymentMethod) {
          setSelectedPaymentMethod(quote.paymentMethod);
        }
        if (quote.validityDays) {
          setSelectedValidityDays(Number(quote.validityDays) || 15);
        }
      }
    }
  }, [selectedQuoteId, quotes]);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTransformToOrder = () => {
    if (!selectedQuoteId) return;
    const updatedQuotes = quotes.map(q => 
      q.id === selectedQuoteId 
        ? { 
            ...q, 
            status: 'pedido' as const,
            paymentMethod: selectedPaymentMethod,
            validityDays: selectedValidityDays
          } 
        : q
    );
    setQuotes(updatedQuotes);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));
    
    const targetOrder = updatedQuotes.find(q => q.id === selectedQuoteId);
    if (targetOrder) {
      saveQuoteToFirestore(targetOrder).catch(e => console.warn('Firestore save order:', e));
    }

    setSelectedQuoteId('');
    showNotification('Orçamento transformado em Ordem de Serviço com sucesso!');
    syncAllData().catch(e => console.error('Sync failed', e));
    if (typeof window !== 'undefined') {
      const scrollContainer = document.getElementById('main-content-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleDeleteOrder = (order: FullDraft) => {
    setOrderToDelete(order);
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const target = orderToDelete;
    setIsDeleting(true);

    try {
      // 1. Atualizar estado local
      const updatedQuotes = quotes.filter(q => q.id !== target.id);
      setQuotes(updatedQuotes);
      localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));

      // 2. Apagar no Firestore
      try {
        await deleteQuoteFromFirestore(target.id);
        logger.info('Pedidos', `O.S. #${target.quoteNumber} removida do Firestore`);
      } catch (err) {
        console.warn('Erro ao deletar O.S. no Firestore:', err);
      }

      // 3. Sincronizar com Google Sheets
      if (isConnected) {
        syncAllData().catch(e => console.error('Sync failed', e));
      }

      showNotification(`Ordem de Serviço #${target.quoteNumber} excluída.`, 'info');
    } catch (e: any) {
      showNotification('Erro ao excluir Ordem de Serviço.', 'error');
    } finally {
      setIsDeleting(false);
      setOrderToDelete(null);
    }
  };

  const handleMarkAsCompleted = (id: string) => {
    const updatedQuotes = quotes.map(q => 
      q.id === id ? { ...q, status: 'concluido' as const } : q
    );
    setQuotes(updatedQuotes);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));
    
    const targetOrder = updatedQuotes.find(q => q.id === id);
    if (targetOrder) {
      saveQuoteToFirestore(targetOrder).catch(e => console.warn('Firestore save order:', e));
    }

    showNotification('Ordem de Serviço marcada como concluída!', 'success');
    syncAllData().catch(e => console.error('Sync failed', e));
    if (typeof window !== 'undefined') {
      const scrollContainer = document.getElementById('main-content-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleRevertToOrder = (id: string) => {
    const updatedQuotes = quotes.map(q => 
      q.id === id ? { ...q, status: 'pedido' as const } : q
    );
    setQuotes(updatedQuotes);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));
    
    const targetOrder = updatedQuotes.find(q => q.id === id);
    if (targetOrder) {
      saveQuoteToFirestore(targetOrder).catch(e => console.warn('Firestore save order:', e));
    }

    showNotification('Status revertido para O.S. Em Andamento', 'info');
    syncAllData().catch(e => console.error('Sync failed', e));
  };

  // Gerar PDF da Ordem de Serviço com Termo de Garantia OBRIGATÓRIO (2 páginas)
  const handleGenerateOrderPdf = async (order: FullDraft) => {
    try {
      const clientData = clients.find(c => c.name === order.clientName);
      const localSettings = localStorage.getItem('@jc-eletricista:company_settings');
      const companySettings = localSettings ? JSON.parse(localSettings) : undefined;
      const subtotal = order.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

      await generateQuotePdf({
        quoteNumber: order.quoteNumber,
        date: order.date || new Date().toLocaleDateString('pt-BR'),
        clientName: order.clientName || 'Cliente',
        clientDoc: clientData?.doc,
        clientPhone: clientData?.phone,
        clientEmail: clientData?.email,
        address: order.address || clientData?.address || '',
        items: order.items,
        subtotal: subtotal,
        discount: order.discount || 0,
        total: order.total,
        observations: order.observations,
        paymentMethod: order.paymentMethod || selectedPaymentMethod,
        validityDays: order.validityDays || selectedValidityDays,
        companySettings,
        includeWarranty: true, // OBRIGATÓRIO na Ordem de Serviço
        documentType: 'ordem_servico'
      });

      showNotification('PDF da Ordem de Serviço gerado com sucesso (com Termo de Garantia obrigatório)!', 'success');
    } catch (err: any) {
      showNotification('Erro ao gerar PDF da Ordem de Serviço.', 'error');
    }
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
      <Portal>
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
      </Portal>

      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Gestão de Ordens de Serviço</h1>
          <p className="text-xs text-zinc-400 mt-1">Transforme orçamentos aprovados em Ordens de Serviço oficiais com Termo de Garantia obrigatório.</p>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12}/> O.S. Em Andamento</span>
            <span className="text-2xl font-black text-white">{stats.countActive}</span>
          </div>
          <div className="text-right flex flex-col gap-1">
            <span className="text-sm font-black text-blue-400">R$ {formatCurrency(stats.totalActive)}</span>
            <span className="text-[10px] text-zinc-500">Receita Esperada</span>
          </div>
        </div>
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle size={12}/> O.S. Concluídas</span>
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
            Gerar Ordem de Serviço
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Selecione o Orçamento Pendente</label>
              <a href="/clientes" className="text-[10px] text-[#FF7A00] hover:underline font-bold">+ Novo Cliente</a>
            </div>
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

            {/* Dropdown Forma de Pagamento */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={12} className="text-[#FF7A00]" />
                Forma de Pagamento da O.S.
              </label>
              <div className="relative">
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="w-full bg-[#141418] border border-[#27272a] rounded-lg py-2.5 px-3 text-xs text-zinc-200 focus:outline-none focus:border-[#FF7A00] appearance-none cursor-pointer"
                >
                  {registeredPaymentMethods.map((method) => (
                    <option key={method} value={method} className="bg-[#141418] text-white">
                      {method}
                    </option>
                  ))}
                  {!registeredPaymentMethods.includes(selectedPaymentMethod) && (
                    <option value={selectedPaymentMethod} className="bg-[#141418] text-white">
                      {selectedPaymentMethod}
                    </option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Dropdown Prazo de Validade / Execução */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} className="text-[#FF7A00]" />
                Prazo de Validade / Execução
              </label>
              <div className="relative">
                <select
                  value={selectedValidityDays}
                  onChange={(e) => setSelectedValidityDays(Number(e.target.value))}
                  className="w-full bg-[#141418] border border-[#27272a] rounded-lg py-2.5 px-3 text-xs text-zinc-200 focus:outline-none focus:border-[#FF7A00] appearance-none cursor-pointer"
                >
                  <option value={5} className="bg-[#141418] text-white">5 dias corridos</option>
                  <option value={7} className="bg-[#141418] text-white">7 dias corridos</option>
                  <option value={10} className="bg-[#141418] text-white">10 dias corridos</option>
                  <option value={15} className="bg-[#141418] text-white">15 dias corridos (Padrão)</option>
                  <option value={20} className="bg-[#141418] text-white">20 dias corridos</option>
                  <option value={30} className="bg-[#141418] text-white">30 dias corridos</option>
                  <option value={45} className="bg-[#141418] text-white">45 dias corridos</option>
                  <option value={60} className="bg-[#141418] text-white">60 dias corridos</option>
                  <option value={90} className="bg-[#141418] text-white">90 dias corridos</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            <button
              onClick={handleTransformToOrder}
              disabled={!selectedQuoteId}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF8A00] disabled:bg-[#18181b] disabled:text-zinc-600 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider text-xs px-4 py-3.5 rounded-xl transition-all shadow-lg shadow-[#FF7A00]/10"
            >
              Iniciar Ordem de Serviço <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Orders Lists */}
        <section className="lg:col-span-2 space-y-6">
          
          {/* Active Orders List */}
          <div className="bg-[#0e0e11] rounded-xl border border-[#222226] p-5 shadow-lg shadow-black/40">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-400" size={18} />
              Ordens de Serviço em Andamento
            </h2>
            
            <div className="space-y-3">
              {activeOrders.length > 0 ? (
                activeOrders.map(order => (
                  <div key={order.id} className="p-4 rounded-xl bg-[#141418] border border-[#27272a] hover:border-blue-500/30 flex flex-col sm:flex-row justify-between gap-4 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-bold text-white">{order.clientName}</h3>
                        <span className="bg-[#1f1f28] text-zinc-400 text-[10px] px-2 py-0.5 rounded font-mono">O.S. #{order.quoteNumber}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-2">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {order.date}</span>
                        <span className="flex items-center gap-1"><FileText size={12} /> {order.items.length} itens</span>
                        {order.paymentMethod && (
                          <span className="bg-[#1f1f28] text-[#FF7A00] text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-medium border border-[#2e2e38]">
                            <CreditCard size={10} /> {order.paymentMethod}
                          </span>
                        )}
                        {order.validityDays && (
                          <span className="bg-[#1f1f28] text-zinc-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-medium border border-[#2e2e38]">
                            <Clock size={10} /> {order.validityDays} dias
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end justify-between gap-3 sm:gap-0 border-t sm:border-t-0 sm:border-l border-[#27272a] pt-3 sm:pt-0 sm:pl-4 shrink-0">
                      <span className="text-sm font-black text-[#FF7A00] font-mono">
                        R$ {formatCurrency(order.total)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateOrderPdf(order)}
                          className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#262630] hover:bg-[#323240] px-3 py-1.5 rounded-lg transition-colors border border-[#3f3f4e]"
                          title="Baixar Ordem de Serviço oficial em PDF (com Termo de Garantia)"
                        >
                          <FileDown size={12} className="text-[#FF7A00]" /> PDF O.S.
                        </button>
                        <button 
                          onClick={() => handleMarkAsCompleted(order.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <CheckCircle size={12} /> Concluir
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order)}
                          className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-[#27272a] transition-colors active:scale-95"
                          title="Excluir O.S."
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 text-zinc-500 text-xs bg-[#141418] rounded-xl border border-dashed border-[#27272a]">
                  Nenhuma ordem de serviço em andamento no momento.
                </div>
              )}
            </div>
          </div>

          {/* Completed Orders List */}
          {completedOrders.length > 0 && (
            <div className="bg-[#0e0e11] rounded-xl border border-[#222226] p-5 shadow-lg shadow-black/40">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 opacity-70">
                <CheckCircle className="text-emerald-400" size={18} />
                Ordens de Serviço Concluídas
              </h2>
              
              <div className="space-y-3">
                {completedOrders.map(order => (
                  <div key={order.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-emerald-900/30 flex flex-col sm:flex-row justify-between gap-4 transition-all opacity-80 hover:opacity-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-bold text-white">{order.clientName}</h3>
                        <span className="bg-[#1f1f28] text-zinc-500 text-[10px] px-2 py-0.5 rounded font-mono">O.S. #{order.quoteNumber}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Concluído</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 mt-2">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {order.date}</span>
                        {order.paymentMethod && (
                          <span className="bg-[#141418] text-zinc-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-medium border border-[#222228]">
                            <CreditCard size={10} /> {order.paymentMethod}
                          </span>
                        )}
                        {order.validityDays && (
                          <span className="bg-[#141418] text-zinc-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-medium border border-[#222228]">
                            <Clock size={10} /> {order.validityDays} dias
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end justify-between gap-3 sm:gap-0 border-t sm:border-t-0 sm:border-l border-[#242429] pt-3 sm:pt-0 sm:pl-4 shrink-0">
                      <span className="text-sm font-bold text-zinc-400 font-mono">
                        R$ {formatCurrency(order.total)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateOrderPdf(order)}
                          className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#1c1c22] hover:bg-[#282830] px-3 py-1.5 rounded-lg transition-colors border border-[#353540]"
                          title="Baixar Ordem de Serviço oficial em PDF (com Termo de Garantia)"
                        >
                          <FileDown size={12} className="text-[#FF7A00]" /> PDF O.S.
                        </button>
                        <button 
                          onClick={() => handleRevertToOrder(order.id)}
                          className="text-[10px] font-bold text-zinc-400 hover:text-blue-400 bg-[#18181b] hover:bg-[#27272a] px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Reverter para Andamento
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order)}
                          className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-[#27272a] transition-colors active:scale-95"
                          title="Excluir O.S."
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

      <Portal>
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE ORDEM DE SERVIÇO */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141418] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Excluir Ordem de Serviço</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Esta ação removerá a O.S. permanentemente.</p>
              </div>
            </div>

            <div className="bg-[#0e0e11] p-3.5 rounded-xl border border-[#242429] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Número da O.S.:</span>
                <span className="font-mono font-bold text-white">#{orderToDelete.quoteNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Cliente:</span>
                <span className="font-bold text-zinc-200 truncate max-w-[200px]">{orderToDelete.clientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Valor Total:</span>
                <span className="font-mono font-bold text-[#FF7A00]">R$ {formatCurrency(orderToDelete.total)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#222228]">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-[#1e1e26] hover:bg-[#282834] rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOrder}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-red-600/20 active:scale-[0.98] disabled:opacity-50"
              >
                <Trash2 size={13} />
                {isDeleting ? 'Excluindo...' : 'Excluir Definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
      </Portal>
    </>
  );
}

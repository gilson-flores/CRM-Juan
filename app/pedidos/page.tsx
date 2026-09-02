'use client';
import { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Search, 
  FileText, 
  CheckSquare, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  FileDown, 
  AlertTriangle, 
  CreditCard, 
  PlusCircle, 
  Plus, 
  X, 
  MapPin, 
  Loader2, 
  Wrench, 
  User, BookOpen, 
  RotateCcw 
} from 'lucide-react';
import type { FullDraft, QuoteItem } from '../orcamentos/page';
import type { Client } from '../clientes/page';
import { useGoogleSheets, CatalogItem } from '@/hooks/useGoogleSheets';
import { generateQuotePdf } from '@/lib/generatePdf';
import { 
  db, 
  saveQuoteToFirestore, 
  deleteQuoteFromFirestore, 
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_COMPANY_SETTINGS,
  buildBudgetObservations,
  type CompanySettings
, sanitizeData } from '@/lib/firebase';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { Portal } from '@/components/ui/Portal';
import { fetchAddressByCep, formatCep } from '@/lib/viaCep';

export default function PedidosPage() {
  const [quotes, setQuotes] = useState<FullDraft[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [registeredPaymentMethods, setRegisteredPaymentMethods] = useState<string[]>(DEFAULT_PAYMENT_METHODS);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(DEFAULT_PAYMENT_METHODS[0]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<FullDraft | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { syncAllData, isConnected } = useGoogleSheets();

  // Modal de Criação Direta de O.S.
  const [isDirectOsModalOpen, setIsDirectOsModalOpen] = useState(false);
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [directSelectedClientId, setDirectSelectedClientId] = useState('');
  const [directPaymentMethod, setDirectPaymentMethod] = useState(DEFAULT_PAYMENT_METHODS[0]);
  const [directDiscount, setDirectDiscount] = useState(0);

  const computedDirectObservations = useMemo(() => {
    return buildBudgetObservations({
      paymentMethod: directPaymentMethod,
      companySettings,
      isOrder: true
    });
  }, [directPaymentMethod, companySettings]);

  const [newDirectItem, setNewDirectItem] = useState<QuoteItem>({ id: "", description: "", quantity: 1, unitPrice: 0 });
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  const filteredCatalog = useMemo(() => {
    return catalogItems.filter(item => 
      !catalogSearch || 
      item.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
      (item.description || "").toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(catalogSearch.toLowerCase())
    );
  }, [catalogItems, catalogSearch]);

  // Itens da O.S. Direta
  const [directItems, setDirectItems] = useState<QuoteItem[]>([
    { id: 'item-1', description: '', quantity: 1, unitPrice: 0 }
  ]);

  // Dados do Novo Cliente (caso cadastrado diretamente na O.S.)
  const [newClientData, setNewClientData] = useState({
    name: '',
    doc: '',
    phone: '',
    email: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('@jc-eletricista:saved_drafts_v2');
      const savedClients = localStorage.getItem('@jc-eletricista:clients');
      const savedSettings = localStorage.getItem('@jc-eletricista:company_settings');
      const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');

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
      if (savedCatalog) {
        try {
          setCatalogItems(JSON.parse(savedCatalog));
        } catch (e) {}
      }
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setCompanySettings(parsed);
          if (parsed.paymentMethods && Array.isArray(parsed.paymentMethods) && parsed.paymentMethods.length > 0) {
            setRegisteredPaymentMethods(parsed.paymentMethods);
            const defaultMethod = parsed.defaultPaymentMethod || parsed.paymentMethods[0];
            setSelectedPaymentMethod(defaultMethod);
            setDirectPaymentMethod(defaultMethod);
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

    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      if (!snapshot.empty) {
        const list: Client[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Client);
        });
        if (list.length > 0) {
          setClients(list);
          localStorage.setItem('@jc-eletricista:clients', JSON.stringify(list));
        }
      }
    }, (err) => console.warn('Firestore clients listener:', err));

    const unsubSettings = onSnapshot(collection(db, 'company_settings'), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as CompanySettings;
        setCompanySettings(data);
        if (data.paymentMethods && Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0) {
          setRegisteredPaymentMethods(data.paymentMethods);
        }
      }
    }, (err) => console.warn('Firestore settings listener:', err));

    return () => {
      clearTimeout(timer);
      unsubQuotes();
      unsubClients();
      unsubSettings();
    };
  }, []);

  // When selected quote changes, adopt its payment method if set
  useEffect(() => {
    if (selectedQuoteId) {
      const quote = quotes.find(q => q.id === selectedQuoteId);
      if (quote && quote.paymentMethod) {
        setSelectedPaymentMethod(quote.paymentMethod);
      }
    }
  }, [selectedQuoteId, quotes]);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const smoothScrollToTop = () => {
    if (typeof window !== 'undefined') {
      const scrollContainer = document.getElementById('main-content-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleTransformToOrder = () => {
    if (!selectedQuoteId) return;
    const updatedQuotes = quotes.map(q => 
      q.id === selectedQuoteId 
        ? { 
            ...q, 
            status: 'pedido' as const,
            paymentMethod: selectedPaymentMethod,
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
    showNotification('Orçamento transformado em Ordem de Serviço com sucesso!', 'success');
    syncAllData().catch(e => console.error('Sync failed', e));
    smoothScrollToTop();
  };

  // Manipulação de CEP na O.S. Direta
  const handleDirectCepChange = async (val: string) => {
    const formatted = formatCep(val);
    setNewClientData(prev => ({ ...prev, cep: formatted }));
    
    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsLoadingCep(true);
      const res = await fetchAddressByCep(clean);
      setIsLoadingCep(false);
      if (res) {
        setNewClientData(prev => ({
          ...prev,
          cep: res.cep || formatted,
          address: res.logradouro || prev.address,
          complement: res.complemento || prev.complement,
          neighborhood: res.bairro || prev.neighborhood,
          city: res.localidade || prev.city,
          state: res.uf || prev.state,
        }));
        showNotification('Endereço preenchido automaticamente pelo CEP!', 'success');
        setTimeout(() => {
          document.getElementById('direct-client-number-input')?.focus();
        }, 100);
      } else {
        showNotification('CEP não localizado. Digite o endereço manualmente.', 'info');
      }
    }
  };

  // Gerenciamento de itens da O.S. Direta
  const handleAddDirectItem = () => {
    if (newDirectItem.description.trim() && newDirectItem.quantity > 0) {
      const generatedId = `item-${Date.now()}`;
      setDirectItems(prev => [...prev, { ...newDirectItem, id: generatedId }]);
      setNewDirectItem({ id: "", description: "", quantity: 1, unitPrice: 0 });
    }
  };

  const handleSelectFromCatalogForDirect = (catalogItem: CatalogItem) => {
    const generatedId = `item-${Date.now()}`;
    setDirectItems(prev => [
      ...prev,
      {
        id: generatedId,
        description: catalogItem.name + (catalogItem.description ? ` (${catalogItem.description})` : ""),
        quantity: 1,
        unitPrice: catalogItem.unitPrice,
        catalogId: catalogItem.id
      }
    ]);
    setIsCatalogModalOpen(false);
  };


  const handleRemoveDirectItem = (index: number) => {
    if (directItems.length <= 1) {
      setDirectItems([{ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]);
      return;
    }
    setDirectItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDirectItem = (index: number, field: keyof QuoteItem, value: any) => {
    setDirectItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSelectCatalogItemForDirect = (index: number, catalogId: string) => {
    const cat = catalogItems.find(c => c.id === catalogId);
    if (!cat) return;
    setDirectItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        description: cat.name + (cat.description ? ` (${cat.description})` : ''),
        unitPrice: Number(cat.unitPrice) || 0,
        catalogId: cat.id
      };
      return copy;
    });
  };

  // Cálculos da O.S. Direta
  const directSubtotal = useMemo(() => {
    return directItems.reduce((acc, it) => acc + ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0);
  }, [directItems]);

  const directTotal = useMemo(() => {
    return Math.max(0, directSubtotal - (Number(directDiscount) || 0));
  }, [directSubtotal, directDiscount]);

  // GERAÇÃO DIRETA DA O.S. (Gera automaticamente o Orçamento subjacente)
  const handleCreateDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    let clientName = '';
    let clientAddress = '';

    if (clientMode === 'existing') {
      const existingClient = clients.find(c => c.id === directSelectedClientId);
      if (!existingClient) {
        showNotification('Selecione um cliente cadastrado ou clique em "Novo Cliente".', 'error');
        return;
      }
      clientName = existingClient.name;
      const addrParts = [
        existingClient.address,
        existingClient.number ? `nº ${existingClient.number}` : '',
        existingClient.complement,
        existingClient.neighborhood ? `- ${existingClient.neighborhood}` : '',
        existingClient.city ? `${existingClient.city}/${existingClient.state || ''}` : ''
      ].filter(Boolean).join(', ');
      clientAddress = addrParts || existingClient.address || '';
    } else {
      // Validar novo cliente
      if (!newClientData.name.trim() || !newClientData.phone.trim() || !newClientData.address.trim()) {
        showNotification('Preencha os campos obrigatórios do cliente (Nome, Telefone, Endereço).', 'error');
        return;
      }

      clientName = newClientData.name.trim();
      const addrParts = [
        newClientData.address,
        newClientData.number ? `nº ${newClientData.number}` : '',
        newClientData.complement,
        newClientData.neighborhood ? `- ${newClientData.neighborhood}` : '',
        newClientData.city ? `${newClientData.city}/${newClientData.state || ''}` : ''
      ].filter(Boolean).join(', ');
      clientAddress = addrParts || newClientData.address;

      // Salvar o novo cliente
      const newClientObj: Client = {
        id: `${Date.now()}`,
        type: 'pf',
        name: newClientData.name.trim(),
        doc: newClientData.doc.trim() || 'Não informado',
        phone: newClientData.phone.trim(),
        email: newClientData.email.trim(),
        cep: newClientData.cep.trim(),
        address: newClientData.address.trim(),
        number: newClientData.number.trim(),
        complement: newClientData.complement.trim(),
        neighborhood: newClientData.neighborhood.trim(),
        city: newClientData.city.trim(),
        state: newClientData.state.trim(),
        createdAt: new Date().toLocaleDateString('pt-BR')
      };

      const updatedClients = [newClientObj, ...clients];
      setClients(updatedClients);
      localStorage.setItem('@jc-eletricista:clients', JSON.stringify(updatedClients));
      try {
        await setDoc(doc(db, 'clients', String(newClientObj.id)), sanitizeData(newClientObj), { merge: true });
      } catch (err) {
        console.warn('Erro ao salvar cliente no Firestore:', err);
      }
    }

    // Validar itens
    const validItems = directItems.filter(it => it.description.trim().length > 0);
    if (validItems.length === 0) {
      showNotification('Adicione pelo menos 1 serviço ou material na Ordem de Serviço.', 'error');
      return;
    }

    // Gerar Número da O.S. / Orçamento sequencial
    const currentYear = new Date().getFullYear();
    const existingCount = quotes.length + 1;
    const generatedNumber = `${currentYear}-${existingCount.toString().padStart(4, '0')}`;
    const generatedId = `quote-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const todayFormatted = new Date().toLocaleDateString('pt-BR');

    // Construir o Orçamento / O.S. completo
    const newOrderQuote: FullDraft = {
      id: generatedId,
      quoteNumber: generatedNumber,
      clientName: clientName,
      address: clientAddress,
      items: validItems.map((it, idx) => ({
        id: it.id || `item-${idx + 1}`,
        description: it.description.trim(),
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        catalogId: it.catalogId
      })),
      discount: Number(directDiscount) || 0,
      observations: computedDirectObservations,
      total: directTotal,
      date: todayFormatted,
      savedAt: nowIso,
      status: 'pedido', // Inicia diretamente como Ordem de Serviço Ativa
      paymentMethod: directPaymentMethod
    };

    // Salvar localmente e no Firestore
    const updatedQuotes = [newOrderQuote, ...quotes];
    setQuotes(updatedQuotes);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));

    try {
      await saveQuoteToFirestore(newOrderQuote);
      logger.info('Pedidos', `Ordem de Serviço #${generatedNumber} e Orçamento subjacente criados com sucesso!`);
    } catch (err) {
      console.warn('Erro ao salvar O.S. no Firestore:', err);
    }

    // Resetar formulário
    setIsDirectOsModalOpen(false);
    setDirectItems([{ id: 'item-1', description: '', quantity: 1, unitPrice: 0 }]);
    setDirectDiscount(0);
    setNewClientData({
      name: '',
      doc: '',
      phone: '',
      email: '',
      cep: '',
      address: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    });

    showNotification(`Ordem de Serviço #${generatedNumber} iniciada com sucesso (Orçamento gerado automaticamente)!`, 'success');
    syncAllData().catch(e => console.error('Sync failed', e));
    smoothScrollToTop();
  };

  const handleDeleteOrder = (order: FullDraft) => {
    setOrderToDelete(order);
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const target = orderToDelete;
    setIsDeleting(true);

    try {
      const updatedQuotes = quotes.filter(q => q.id !== target.id);
      setQuotes(updatedQuotes);
      localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedQuotes));

      try {
        await deleteQuoteFromFirestore(target.id);
        logger.info('Pedidos', `O.S. #${target.quoteNumber} removida do Firestore`);
      } catch (err) {
        console.warn('Erro ao deletar O.S. no Firestore:', err);
      }

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

    showNotification('Ordem de Serviço concluída com sucesso!', 'success');
    syncAllData().catch(e => console.error('Sync failed', e));
    smoothScrollToTop();
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
    smoothScrollToTop();
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
        companySettings,
        includeWarranty: true, // OBRIGATÓRIO na Ordem de Serviço
        documentType: 'ordem_servico'
      });

      showNotification('PDF da Ordem de Serviço gerado com sucesso (com Termo de Garantia)!', 'success');
    } catch (err: any) {
      showNotification('Erro ao gerar PDF da Ordem de Serviço.', 'error');
    }
  };

  const availableQuotes = quotes.filter(q => q.status === 'enviado' || !q.status || q.status === 'rascunho');
  const activeOrders = quotes.filter(q => q.status === 'pedido');
  const completedOrders = quotes.filter(q => q.status === 'concluido');

  const formatCurrency = (val: number) => (Number(val) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
          <div className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl shadow-2xl border text-xs font-bold backdrop-blur-md ${
            notification.type === 'success' ? 'bg-[#141418]/95 border-emerald-500/50 text-emerald-300' :
            notification.type === 'error' ? 'bg-[#141418]/95 border-red-500/50 text-red-300' :
            'bg-[#141418]/95 border-[#FF7A00]/50 text-[#FF7A00]'
          }`}>
            <CheckCircle size={18} className="shrink-0" />
            <span>{notification.text}</span>
          </div>
        </div>
      )}
      </Portal>

      {/* Header & Quick Action */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Gestão de Ordens de Serviço</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Crie O.S. diretamente ou transforme orçamentos aprovados com emissão oficial de Termo de Garantia.</p>
        </div>
        <button
          onClick={() => setIsDirectOsModalOpen(true)}
          className="bg-[#FF7A00] hover:bg-[#FF8A00] text-black font-black text-xs uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all shadow-lg shadow-[#FF7A00]/20 flex items-center justify-center gap-2 active:scale-[0.98] shrink-0"
        >
          <Plus size={16} />
          Nova O.S. Direta
        </button>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={14}/> O.S. Em Andamento
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.countActive}</span>
          </div>
          <div className="text-right flex flex-col gap-1">
            <span className="text-base sm:text-lg font-black text-blue-400 font-mono">R$ {formatCurrency(stats.totalActive)}</span>
            <span className="text-[11px] text-zinc-500 font-medium">Receita em Execução</span>
          </div>
        </div>
        <div className="bg-[#0e0e11] border border-[#222226] rounded-xl p-5 flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle size={14}/> O.S. Concluídas
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.countCompleted}</span>
          </div>
          <div className="text-right flex flex-col gap-1">
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">R$ {formatCurrency(stats.totalCompleted)}</span>
            <span className="text-[11px] text-zinc-500 font-medium">Receita Concretizada</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Transform Quote to Order Area */}
        <section className="lg:col-span-1 bg-[#0e0e11] rounded-xl border border-[#222226] p-5 shadow-lg shadow-black/40">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <CheckSquare className="text-[#FF7A00]" size={18} />
            Vincular Orçamento Aprovado
          </h2>
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Selecione o Orçamento</label>
              <button onClick={() => setIsDirectOsModalOpen(true)} className="text-[10px] text-[#FF7A00] hover:underline font-bold">
                + Fazer Direto
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <select 
                className="w-full bg-[#141418] border border-[#27272a] rounded-lg py-3 pl-9 pr-3 text-xs text-zinc-200 focus:outline-none focus:border-[#FF7A00] appearance-none"
                value={selectedQuoteId}
                onChange={(e) => setSelectedQuoteId(e.target.value)}
              >
                <option value="">Buscar orçamentos enviados / rascunhos...</option>
                {availableQuotes.map(q => (
                  <option key={q.id} value={q.id}>#{q.quoteNumber} - {q.clientName} (R$ {formatCurrency(q.total)})</option>
                ))}
              </select>
            </div>

            {/* Forma de Pagamento da O.S. */}
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

            <button
              onClick={handleTransformToOrder}
              disabled={!selectedQuoteId}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF8A00] disabled:bg-[#18181b] disabled:text-zinc-600 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider text-xs px-4 py-3.5 rounded-xl transition-all shadow-lg shadow-[#FF7A00]/10 active:scale-[0.98]"
            >
              Iniciar Ordem de Serviço <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Orders Lists */}
        <section className="lg:col-span-2 space-y-6">
          
          {/* Active Orders List */}
          <div className="bg-[#0e0e11] rounded-xl border border-[#222226] p-5 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-blue-400" size={18} />
                Ordens de Serviço em Andamento
              </h2>
              <span className="text-xs text-zinc-400 font-mono font-bold bg-[#141418] px-2.5 py-1 rounded-lg border border-[#27272a]">
                {activeOrders.length} {activeOrders.length === 1 ? 'ativa' : 'ativas'}
              </span>
            </div>
            
            <div className="space-y-3.5">
              {activeOrders.length > 0 ? (
                activeOrders.map(order => (
                  <div key={order.id} className="p-4 sm:p-5 rounded-xl bg-[#141418] border border-[#27272a] hover:border-blue-500/40 flex flex-col md:flex-row justify-between gap-4 transition-all">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-sm sm:text-base font-bold text-white">{order.clientName}</h3>
                        <span className="bg-[#1f1f28] text-zinc-300 text-xs px-2.5 py-0.5 rounded-md font-mono border border-[#2f2f3e]">
                          O.S. #{order.quoteNumber}
                        </span>
                        <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-blue-500/20">
                          Em Execução
                        </span>
                      </div>

                      {order.address && (
                        <p className="text-xs text-zinc-400 flex items-center gap-1.5 line-clamp-1">
                          <MapPin size={12} className="text-zinc-500 shrink-0" />
                          <span>{order.address}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 pt-1">
                        <span className="flex items-center gap-1 bg-[#1a1a22] px-2.5 py-1 rounded-md border border-[#262632]">
                          <Calendar size={12} className="text-zinc-400" /> {order.date}
                        </span>
                        <span className="flex items-center gap-1 bg-[#1a1a22] px-2.5 py-1 rounded-md border border-[#262632]">
                          <FileText size={12} className="text-zinc-400" /> {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                        </span>
                        {order.paymentMethod && (
                          <span className="bg-[#1a1a22] text-[#FF7A00] text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium border border-[#2e2e3e]">
                            <CreditCard size={12} /> {order.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end justify-between gap-3 border-t md:border-t-0 md:border-l border-[#27272a] pt-3 md:pt-0 md:pl-5 shrink-0">
                      <div className="flex items-baseline md:flex-col md:items-end justify-between w-full">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 md:hidden">Valor Total</span>
                        <span className="text-lg sm:text-xl font-black text-[#FF7A00] font-mono">
                          R$ {formatCurrency(order.total)}
                        </span>
                      </div>

                      {/* BOTOES AUMENTADOS: PDF O.S. e CONCLUIR */}
                      <div className="flex items-center gap-2.5 w-full md:w-auto">
                        <button
                          onClick={() => handleGenerateOrderPdf(order)}
                          className="flex-1 md:flex-initial min-h-[46px] px-5 py-2.5 rounded-xl font-black text-xs text-white bg-[#22222a] hover:bg-[#2e2e38] border border-[#3e3e50] shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                          title="Baixar Ordem de Serviço oficial em PDF (com Termo de Garantia)"
                        >
                          <FileDown size={16} className="text-[#FF7A00] shrink-0" />
                          <span>PDF O.S.</span>
                        </button>
                        <button 
                          onClick={() => handleMarkAsCompleted(order.id)}
                          className="flex-1 md:flex-initial min-h-[46px] px-5 py-2.5 rounded-xl font-black text-xs text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                          title="Marcar O.S. como concluída"
                        >
                          <CheckCircle size={16} className="shrink-0" />
                          <span>Concluir</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order)}
                          className="text-zinc-500 hover:text-red-400 p-3 rounded-xl hover:bg-[#27272a] transition-colors active:scale-95 shrink-0"
                          title="Excluir O.S."
                        >
                          <Trash2 size={16} />
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
              <div className="flex items-center justify-between mb-4 opacity-80">
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle className="text-emerald-400" size={18} />
                  Ordens de Serviço Concluídas
                </h2>
                <span className="text-xs text-emerald-400 font-mono font-bold bg-[#141418] px-2.5 py-1 rounded-lg border border-emerald-900/40">
                  {completedOrders.length} {completedOrders.length === 1 ? 'concluída' : 'concluídas'}
                </span>
              </div>
              
              <div className="space-y-3.5">
                {completedOrders.map(order => (
                  <div key={order.id} className="p-4 sm:p-5 rounded-xl bg-[#0a0a0c] border border-emerald-900/30 flex flex-col md:flex-row justify-between gap-4 transition-all opacity-85 hover:opacity-100">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-sm sm:text-base font-bold text-white">{order.clientName}</h3>
                        <span className="bg-[#1f1f28] text-zinc-400 text-xs px-2.5 py-0.5 rounded-md font-mono">
                          O.S. #{order.quoteNumber}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                          Concluído
                        </span>
                      </div>

                      {order.address && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1.5 line-clamp-1">
                          <MapPin size={12} className="text-zinc-600 shrink-0" />
                          <span>{order.address}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 pt-1">
                        <span className="flex items-center gap-1 bg-[#141418] px-2.5 py-1 rounded-md border border-[#222228]">
                          <Calendar size={12} /> {order.date}
                        </span>
                        {order.paymentMethod && (
                          <span className="bg-[#141418] text-zinc-400 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium border border-[#222228]">
                            <CreditCard size={12} /> {order.paymentMethod}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end justify-between gap-3 border-t md:border-t-0 md:border-l border-[#242429] pt-3 md:pt-0 md:pl-5 shrink-0">
                      <div className="flex items-baseline md:flex-col md:items-end justify-between w-full">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 md:hidden">Valor Total</span>
                        <span className="text-base sm:text-lg font-bold text-zinc-400 font-mono">
                          R$ {formatCurrency(order.total)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 w-full md:w-auto">
                        <a
                          href="https://www.nfse.gov.br/EmissorNacional/Login?ReturnUrl=%2fEmissorNacional%2fNotas%2fEmitidas"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 md:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 border border-blue-500/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                          title="Emitir Nota Fiscal (Portal Nacional)"
                        >
                          <FileText size={15} />
                          <span>Emitir Nota</span>
                        </a>
                        <button
                          onClick={() => handleGenerateOrderPdf(order)}
                          className="flex-1 md:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#1c1c22] hover:bg-[#282830] border border-[#353540] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                          title="Baixar Ordem de Serviço oficial em PDF"
                        >
                          <FileDown size={15} className="text-[#FF7A00]" />
                          <span>PDF O.S.</span>
                        </button>
                        <button 
                          onClick={() => handleRevertToOrder(order.id)}
                          className="min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-blue-400 bg-[#18181b] hover:bg-[#27272a] border border-[#2a2a35] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                          title="Reverter para em andamento"
                        >
                          <RotateCcw size={14} />
                          <span className="hidden sm:inline">Reverter</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order)}
                          className="text-zinc-600 hover:text-red-400 p-2.5 rounded-xl hover:bg-[#27272a] transition-colors active:scale-95 shrink-0"
                          title="Excluir O.S."
                        >
                          <Trash2 size={16} />
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
      {/* MODAL: CRIAR ORDEM DE SERVIÇO DIRETA */}
      {isDirectOsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#141418] border border-[#282834] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-[#282834] flex items-center justify-between bg-[#0e0e11] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/10 border border-[#FF7A00]/30 flex items-center justify-center text-[#FF7A00]">
                  <Wrench size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Criar Ordem de Serviço Direta</h2>
                  <p className="text-[11px] text-zinc-400">Gera a O.S. e o Orçamento correspondente de forma integrada e automática.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDirectOsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#22222a]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <form id="directOsForm" onSubmit={handleCreateDirectOrder} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Seleção ou Cadastro de Cliente */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={13} className="text-[#FF7A00]" /> Cliente da Obra
                  </span>
                  <div className="flex items-center bg-[#0a0a0d] p-1 rounded-lg border border-[#22222a]">
                    <button
                      type="button"
                      onClick={() => setClientMode('existing')}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${clientMode === 'existing' ? 'bg-[#FF7A00] text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Cliente Cadastrado
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientMode('new')}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${clientMode === 'new' ? 'bg-[#FF7A00] text-black shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                    >
                      + Novo Cliente
                    </button>
                  </div>
                </div>

                {clientMode === 'existing' ? (
                  <div>
                    <select
                      value={directSelectedClientId}
                      onChange={(e) => setDirectSelectedClientId(e.target.value)}
                      required
                      className="w-full bg-[#0a0a0d] border border-[#27272a] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                    >
                      <option value="">Selecione um cliente...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''} - {c.address || 'Sem endereço'}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#0a0a0d] border border-[#24242e] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Nome do Cliente *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nome completo ou Razão Social"
                          value={newClientData.name}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-[#141418] border border-[#27272a] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Telefone / WhatsApp *</label>
                        <input
                          type="text"
                          required
                          placeholder="(47) 99999-9999"
                          value={newClientData.phone}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full bg-[#141418] border border-[#27272a] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">CPF / CNPJ</label>
                        <input
                          type="text"
                          placeholder="000.000.000-00"
                          value={newClientData.doc}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, doc: e.target.value }))}
                          className="w-full bg-[#141418] border border-[#27272a] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">E-mail</label>
                        <input
                          type="email"
                          placeholder="email@exemplo.com"
                          value={newClientData.email}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full bg-[#141418] border border-[#27272a] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                        />
                      </div>
                    </div>

                    {/* Endereço com Busca por CEP */}
                    <div className="pt-2 border-t border-[#202026]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                          <MapPin size={11} className="text-[#FF7A00]" /> Endereço da Instalação
                        </span>
                        <span className="text-[10px] text-[#FF7A00] font-bold">Busca automática por CEP</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">CEP</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="00000-000"
                              maxLength={9}
                              value={newClientData.cep}
                              onChange={(e) => handleDirectCepChange(e.target.value)}
                              className="w-full bg-[#141418] border border-[#27272a] rounded-lg p-2.5 pr-8 text-xs text-white focus:outline-none focus:border-[#FF7A00] font-mono"
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                              {isLoadingCep ? <Loader2 size={14} className="animate-spin text-[#FF7A00]" /> : <Search size={14} />}
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Rua / Logradouro *</label>
                          <input
                            type="text"
                            required
                            placeholder="Rua, Avenida, etc."
                            value={newClientData.address}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full bg-[#141418] border border-[#27272a] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Número *</label>
                          <input
                            id="direct-client-number-input"
                            type="text"
                            required
                            placeholder="Ex: 150"
                            value={newClientData.number}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, number: e.target.value }))}
                            className="w-full bg-[#141418] border border-[#27272a] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00] font-mono"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Complemento / Bairro / Cidade</label>
                          <input
                            type="text"
                            placeholder="Apto, Bairro, Cidade - UF"
                            value={newClientData.complement}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, complement: e.target.value }))}
                            className="w-full bg-[#141418] border border-[#27272a] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabela de Itens / Serviços */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={13} className="text-[#FF7A00]" /> Itens da O.S. ({directItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCatalogModalOpen(true)}
                    className="self-start sm:self-auto bg-[#18181c] hover:bg-[#242429] border border-[#FF7A00]/40 text-[#FF7A00] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <BookOpen size={14} />
                    Tabela de Serviços Cadastrados
                  </button>
                </div>

                <div className="bg-[#0a0a0d] rounded-xl border border-[#24242e] overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[620px]">
                    <thead>
                      <tr className="bg-[#141418] border-b border-[#24242e] text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                        <th className="p-3 w-16">ID</th>
                        <th className="p-3">Descrição do Serviço / Material</th>
                        <th className="p-3 w-20 text-center">Qtd</th>
                        <th className="p-3 w-28 text-right">V. Unitário</th>
                        <th className="p-3 w-28 text-right">Total</th>
                        <th className="p-3 w-10 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#24242e]">
                      {directItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-[#141418] transition-colors group">
                          <td className="p-3 font-mono text-[10px] text-zinc-500 font-bold">{item.id || index + 1}</td>
                          <td className="p-3 text-xs text-white font-medium">{item.description}</td>
                          <td className="p-3 text-xs text-white text-center font-mono">{item.quantity}</td>
                          <td className="p-3 text-xs text-white text-right font-mono">R$ {formatCurrency(item.unitPrice)}</td>
                          <td className="p-3 text-xs text-[#FF7A00] font-bold text-right font-mono">R$ {formatCurrency((item.quantity || 1) * (item.unitPrice || 0))}</td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => handleRemoveDirectItem(index)} 
                              className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                              title="Remover Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      
                      {/* New Item Input Row */}
                      <tr className="bg-[#141418]/50">
                        <td className="p-2 text-[10px] text-zinc-500 text-center font-bold font-mono">NOVO</td>
                        <td className="p-2 relative flex items-center">
                          <input 
                            type="text" 
                            placeholder="Digite o serviço..." 
                            className="w-full bg-[#0a0a0d] border border-[#27272a] focus:border-[#FF7A00] rounded-lg pl-3 pr-10 py-2 text-white text-xs outline-none"
                            value={newDirectItem.description}
                            onChange={(e) => setNewDirectItem({...newDirectItem, description: e.target.value})}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddDirectItem();
                            }}
                          />
                          <button 
                            onClick={() => setIsCatalogModalOpen(true)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#FF7A00] transition-colors p-1"
                            title="Buscar em itens salvos"
                          >
                            <Search size={16} />
                          </button>
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            min="1"
                            className="w-full bg-[#0a0a0d] border border-[#27272a] focus:border-[#FF7A00] rounded-lg px-2 py-2 text-white text-xs outline-none text-center font-mono"
                            value={newDirectItem.quantity}
                            onChange={(e) => setNewDirectItem({...newDirectItem, quantity: Number(e.target.value) || 1})}
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="w-full bg-[#0a0a0d] border border-[#27272a] focus:border-[#FF7A00] rounded-lg px-2 py-2 text-white text-xs outline-none text-right font-mono"
                            value={newDirectItem.unitPrice || ""}
                            onChange={(e) => setNewDirectItem({...newDirectItem, unitPrice: Number(e.target.value) || 0})}
                          />
                        </td>
                        <td className="p-2 text-right text-xs font-bold text-zinc-400 font-mono px-3 py-2">
                          R$ {formatCurrency((newDirectItem.quantity || 1) * (newDirectItem.unitPrice || 0))}
                        </td>
                        <td className="p-2 text-center">
                          <button 
                            onClick={handleAddDirectItem} 
                            disabled={!newDirectItem.description.trim()} 
                            className="text-[#FF7A00] hover:text-[#FFA845] transition-colors disabled:opacity-30 p-1"
                            title="Adicionar Item"
                          >
                            <PlusCircle size={22} />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Condições, Pagamento e Totais */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#202026]">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 flex items-center gap-1">
                      <CreditCard size={11} className="text-[#FF7A00]" /> Forma de Pagamento
                    </label>
                    <select
                      value={directPaymentMethod}
                      onChange={(e) => setDirectPaymentMethod(e.target.value)}
                      className="w-full bg-[#0a0a0d] border border-[#27272a] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                    >
                      {registeredPaymentMethods.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                        Observações &amp; Termos da O.S.
                      </label>
                      <span className="text-[9px] bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/25 font-mono px-1.5 py-0.5 rounded font-bold">
                        Automático
                      </span>
                    </div>
                    <div className="w-full bg-[#0a0a0d] border border-[#27272a] rounded-xl p-2.5 text-[11px] text-zinc-300 font-sans leading-relaxed whitespace-pre-line">
                      {computedDirectObservations}
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0a0d] p-4 rounded-xl border border-[#24242e] flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Subtotal dos Itens:</span>
                      <span className="font-mono font-bold text-zinc-200">R$ {formatCurrency(directSubtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Desconto Aplicado:</span>
                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={directDiscount || ''}
                          onChange={(e) => setDirectDiscount(Number(e.target.value) || 0)}
                          placeholder="0,00"
                          className="w-full bg-[#141418] border border-[#27272a] rounded-lg p-1.5 text-xs text-right text-red-400 font-mono focus:outline-none focus:border-[#FF7A00]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#222228] flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Total da O.S.:</span>
                    <span className="text-xl font-black text-[#FF7A00] font-mono">
                      R$ {formatCurrency(directTotal)}
                    </span>
                  </div>
                </div>
              </div>

            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#282834] bg-[#0e0e11] flex flex-col-reverse sm:flex-row sm:justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsDirectOsModalOpen(false)}
                className="w-full sm:w-auto px-5 py-3 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-[#1a1a22] transition-colors rounded-xl"
              >
                Cancelar
              </button>
              <button
                form="directOsForm"
                type="submit"
                className="w-full sm:w-auto bg-[#FF7A00] hover:bg-[#FF8A00] text-black text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-[#FF7A00]/20 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <CheckSquare size={16} />
                Criar e Iniciar O.S.
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE ORDEM DE SERVIÇO */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141418] border-t-4 border-t-red-600 border-x border-b border-[#292930] rounded-2xl w-[92vw] max-w-[400px] min-w-[300px] p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col gap-5">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 mb-2">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">Excluir Ordem de Serviço</h3>
              <p className="text-[11px] font-bold text-zinc-400">Esta ação é irreversível e removerá o registro permanentemente.</p>
            </div>

            <div className="bg-[#080808] p-4 rounded-xl border border-[#242429] text-xs space-y-2 w-full">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Número da O.S.:</span>
                <span className="font-mono font-bold text-white text-sm">#{orderToDelete.quoteNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Cliente:</span>
                <span className="font-bold text-zinc-200 truncate max-w-[200px]">{orderToDelete.clientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Valor Total:</span>
                <span className="font-mono font-bold text-[#FF7A00] text-sm">R$ {formatCurrency(orderToDelete.total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 w-full">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 text-xs font-bold text-zinc-300 hover:text-white bg-[#1e1e26] hover:bg-[#282834] rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 border border-[#2c2c35]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOrder}
                disabled={isDeleting}
                className="flex-1 py-3 text-xs font-black text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-[0.98] disabled:opacity-50"
              >
                <Trash2 size={15} />
                {isDeleting ? "Excluindo..." : "Excluir Definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: CATÁLOGO DE SERVIÇOS/MATERIAIS (O.S) */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141418] border border-[#292930] rounded-2xl w-full xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-5 border-b border-[#242429]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <BookOpen size={18} className="text-[#FF7A00]" />
                <span>Serviços e Materiais Salvos</span>
              </div>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-[#242429] bg-[#0e0e11]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Pesquisar serviço (ex: tomada, disjuntor, chuveiro)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-[#141418] border border-[#28282e] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2">
              {filteredCatalog.length > 0 ? (
                filteredCatalog.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectFromCatalogForDirect(item)}
                    className="p-3 bg-[#0e0e11] hover:bg-[#181820] border border-[#242429] hover:border-[#FF7A00]/50 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-[#FF7A00] transition-colors">{item.name}</span>
                        <span className="px-2 py-0.5 bg-[#1f1f28] text-zinc-400 text-[10px] rounded font-medium">
                          {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[#FF7A00] font-mono">
                        R$ {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-zinc-500 text-xs mb-3">Nenhum serviço/material encontrado no catálogo.</p>
                  <a href="/configuracoes" className="px-4 py-2 bg-[#181820] hover:bg-[#202028] text-white text-xs font-bold rounded-lg transition-colors border border-[#27272a] inline-block">
                    Cadastrar Novo Item no Catálogo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </Portal>

    </>
  );
}

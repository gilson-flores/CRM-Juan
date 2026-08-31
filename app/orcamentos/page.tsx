'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Save, 
  FileDown, 
  User, 
  Wrench, 
  Trash2, 
  PlusCircle, 
  AlignLeft, 
  Eye, 
  Cloud, 
  ExternalLink, 
  History, 
  Check, 
  X, 
  Printer, 
  Search,
  BookOpen,
  Send,
  FileText,
  FileEdit,
  Clock,
  CheckCircle2,
  Filter,
  Layers,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import type { Client } from '../clientes/page';
import { useGoogleSheets, CatalogItem } from '@/hooks/useGoogleSheets';
import { generateQuotePdf } from '@/lib/generatePdf';
import { db, saveQuoteToFirestore, deleteQuoteFromFirestore } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { getAssetUrl } from '@/lib/assetHelper';
import { OfficialLogoSvg } from '@/lib/logoConstant';

// Helper para gerar identificadores únicos de forma segura
let globalItemCounter = 1;
function generateItemId(prefix = 'ITM') {
  globalItemCounter += 1;
  return `${prefix}-${globalItemCounter.toString().padStart(4, '0')}`;
}

export type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  catalogId?: string;
};

export type FullDraft = {
  id: string;
  quoteNumber: string;
  clientName: string;
  address: string;
  items: QuoteItem[];
  discount: number;
  observations: string;
  total: number;
  date: string;
  savedAt: string;
  status?: 'rascunho' | 'enviado' | 'pedido' | 'concluido';
};

export default function OrcamentosPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  
  // Form State
  const [quoteNumber, setQuoteNumber] = useState('2026-0001');
  const [selectedClient, setSelectedClient] = useState('');
  const [address, setAddress] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [newItem, setNewItem] = useState<{ description: string; quantity: number; unitPrice: number; catalogId?: string }>({
    description: '',
    quantity: 1,
    unitPrice: 0
  });
  const [discount, setDiscount] = useState(0);
  const [observations, setObservations] = useState(
    '• Orçamento válido por 15 dias corridos.\n• Garantia sobre os serviços executados.\n• Materiais por conta do contratante, salvo acordo prévio.'
  );

  const { syncAllData, isConnected } = useGoogleSheets();
  const [savedDrafts, setSavedDrafts] = useState<FullDraft[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Estados de filtro e busca para a lista de orçamentos (separação rascunhos x enviados)
  const [listFilter, setListFilter] = useState<'todos' | 'rascunhos' | 'enviados'>('todos');
  const [listSearch, setListSearch] = useState('');

  // Modais
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewModalPage, setPreviewModalPage] = useState<'ambas' | 'orcamento' | 'garantia'>('ambas');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [previewTab, setPreviewTab] = useState<'orcamento' | 'garantia'>('orcamento');
  const [includeWarranty, setIncludeWarranty] = useState(true);
  const [quoteToDelete, setQuoteToDelete] = useState<FullDraft | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Seletores calculados para orçamentos separados
  const rascunhosList = useMemo(() => {
    return savedDrafts.filter(d => !d.status || d.status === 'rascunho');
  }, [savedDrafts]);

  const enviadosList = useMemo(() => {
    return savedDrafts.filter(d => d.status === 'enviado' || d.status === 'pedido' || d.status === 'concluido');
  }, [savedDrafts]);

  const filteredQuotesList = useMemo(() => {
    return savedDrafts.filter(draft => {
      const searchLower = listSearch.toLowerCase();
      const matchesSearch = 
        !listSearch ||
        (draft.clientName || '').toLowerCase().includes(searchLower) ||
        (draft.quoteNumber || '').toLowerCase().includes(searchLower) ||
        (draft.items || []).some(it => it.description.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
      
      if (listFilter === 'rascunhos') {
        return !draft.status || draft.status === 'rascunho';
      }
      if (listFilter === 'enviados') {
        return draft.status === 'enviado' || draft.status === 'pedido' || draft.status === 'concluido';
      }
      return true;
    });
  }, [savedDrafts, listFilter, listSearch]);

  const stats = useMemo(() => {
    const totalCount = savedDrafts.length;
    const rascunhosCount = rascunhosList.length;
    const enviadosCount = enviadosList.length;
    const totalValue = savedDrafts.reduce((acc, d) => acc + (d.total || 0), 0);
    const rascunhosValue = rascunhosList.reduce((acc, d) => acc + (d.total || 0), 0);
    const enviadosValue = enviadosList.reduce((acc, d) => acc + (d.total || 0), 0);
    return {
      totalCount,
      rascunhosCount,
      enviadosCount,
      totalValue,
      rascunhosValue,
      enviadosValue
    };
  }, [savedDrafts, rascunhosList, enviadosList]);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const savedClients = localStorage.getItem('@jc-eletricista:clients');
    const savedDraftsList = localStorage.getItem('@jc-eletricista:saved_drafts_v2');
    const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');
    const savedSettings = localStorage.getItem('@jc-eletricista:company_settings');

    const timer = setTimeout(() => {
      // Gerar número de orçamento inicial caso seja padrão
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setQuoteNumber(`2026-${randomSuffix}`);

      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          let defaultText = parsedSettings.defaultObservations || '• Orçamento válido por 15 dias corridos.\n• Garantia de 90 dias sobre a mão de obra.\n• Materiais por conta do contratante, salvo acordo prévio.';
          if (parsedSettings.pixKey && !defaultText.includes(parsedSettings.pixKey)) {
            defaultText += `\n• Chave PIX (${parsedSettings.pixType || 'Chave'}): ${parsedSettings.pixKey} [${parsedSettings.pixHolder || parsedSettings.ownerName || 'JC Eletricista'}]`;
          }
          setObservations(defaultText);
        } catch {}
      }

      if (savedClients) {
        try { setClients(JSON.parse(savedClients)); } catch {}
      }
      if (savedDraftsList) {
        try { setSavedDrafts(JSON.parse(savedDraftsList)); } catch {}
      }
      if (savedCatalog) {
        try { setCatalogItems(JSON.parse(savedCatalog)); } catch {}
      }
    }, 0);

    // Sincronização em tempo real do Firestore
    const unsubQuotes = onSnapshot(collection(db, 'quotes'), (snapshot) => {
      const list: FullDraft[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as FullDraft);
      });
      
      // Merge local data that might not be in Firestore yet
      const savedDraftsList = localStorage.getItem('@jc-eletricista:saved_drafts_v2');
      if (savedDraftsList) {
        try {
          const localDrafts = JSON.parse(savedDraftsList) as FullDraft[];
          localDrafts.forEach(localItem => {
            const exists = list.find(dbItem => dbItem.id === localItem.id);
            if (!exists) {
              list.push(localItem);
              // Push this missing item to Firestore in the background
              saveQuoteToFirestore(localItem).catch(e => console.warn('Auto-sync missing item to Firestore failed:', e));
            }
          });
        } catch (e) {
          console.warn('Error parsing local drafts for sync:', e);
        }
      }

      if (list.length > 0) {
        setSavedDrafts(list);
        localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(list));
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

    const unsubCatalog = onSnapshot(collection(db, 'catalog'), (snapshot) => {
      if (!snapshot.empty) {
        const list: CatalogItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as CatalogItem);
        });
        if (list.length > 0) {
          setCatalogItems(list);
          localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify(list));
        }
      }
    }, (err) => console.warn('Firestore catalog listener:', err));

    return () => {
      clearTimeout(timer);
      unsubQuotes();
      unsubClients();
      unsubCatalog();
    };
  }, []);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedClient(name);
    const clientData = clients.find(c => c.name === name);
    if (clientData) {
      setAddress(`${clientData.address}, ${clientData.number} - ${clientData.cep}`);
    } else {
      setAddress('');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAddItem = () => {
    if (newItem.description.trim() && newItem.quantity > 0) {
      const generatedId = generateItemId('ITM');
      setItems(prev => [...prev, { ...newItem, id: generatedId }]);
      setNewItem({ description: '', quantity: 1, unitPrice: 0 });
    }
  };

  const handleSelectFromCatalog = (catalogItem: CatalogItem) => {
    const generatedId = generateItemId('ITM');
    setItems(prev => [
      ...prev,
      {
        id: generatedId,
        description: catalogItem.name,
        quantity: 1,
        unitPrice: catalogItem.unitPrice,
        catalogId: catalogItem.id
      }
    ]);
    setIsCatalogModalOpen(false);
    showNotification(`"${catalogItem.name}" adicionado ao orçamento!`, 'info');
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const total = Math.max(0, subtotal - discount);

  // 1. SALVAR RASCUNHO & SINCRONIZAR COM ABA ITENS DO GOOGLE SHEETS
  const handleSaveDraft = async () => {
    if (!selectedClient && items.length === 0) {
      alert('Preencha ao menos o cliente ou adicione itens antes de salvar o rascunho.');
      return;
    }

    setIsSyncing(true);

    const now = new Date();
    const draftId = generateItemId('DRAFT');
    const dateFormatted = now.toLocaleDateString('pt-BR');
    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newDraft: FullDraft = {
      id: draftId,
      quoteNumber,
      clientName: selectedClient || 'Cliente sem nome',
      address,
      items,
      discount,
      observations,
      total,
      date: dateFormatted,
      savedAt: `${dateFormatted} às ${timeFormatted}`,
      status: 'rascunho'
    };

    // Atualizar lista de rascunhos
    const updatedDrafts = [newDraft, ...savedDrafts.filter(d => d.id !== draftId)];
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedDrafts));

    // Salvar no Firestore de forma persistente
    try {
      await saveQuoteToFirestore(newDraft);
      logger.info('Orçamentos', `Orçamento #${newDraft.quoteNumber} salvo com sucesso no Firestore.`);
    } catch (fsErr: any) {
      logger.warn('Orçamentos', `Aviso ao salvar orçamento no Firestore: ${fsErr?.message || fsErr}`);
    }

    // Salvar itens individuais no log de itens com ID próprio e preço
    const savedLog = localStorage.getItem('@jc-eletricista:quote_items_log');
    const existingLog: any[] = savedLog ? JSON.parse(savedLog) : [];
    
    const newItemsEntries = items.map(item => ({
      id: item.id || `ITM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      quoteId: quoteNumber,
      clientName: selectedClient || 'Não informado',
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      date: dateFormatted
    }));

    const updatedLog = [...newItemsEntries, ...existingLog];
    localStorage.setItem('@jc-eletricista:quote_items_log', JSON.stringify(updatedLog));

    // Sincronizar com Google Sheets nas abas Orcamentos e Itens
    if (isConnected) {
      syncAllData().catch(err => console.warn('Failed to sync to sheets:', err));
    }

    setIsSyncing(false);
    showNotification('Rascunho e itens salvos com sucesso!');
    if (typeof window !== 'undefined') {
      const scrollContainer = document.getElementById('main-content-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // 2. RESTAURAR RASCUNHO
  const handleRestoreDraft = (draft: FullDraft) => {
    setSelectedClient(draft.clientName);
    setAddress(draft.address || '');
    setQuoteNumber(draft.quoteNumber || '2026-0001');
    setItems(draft.items || []);
    setDiscount(draft.discount || 0);
    setObservations(draft.observations || '');
    setIsDraftsModalOpen(false);
    showNotification(`Rascunho de "${draft.clientName}" restaurado com sucesso!`);
    if (typeof window !== 'undefined') {
      const scrollContainer = document.getElementById('main-content-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleDeleteDraft = (e: React.MouseEvent, draft: FullDraft) => {
    e.stopPropagation();
    setQuoteToDelete(draft);
  };

  const handleConfirmDelete = async () => {
    if (!quoteToDelete) return;
    const target = quoteToDelete;
    setIsDeleting(true);

    try {
      // 1. Atualiza estado local imediatamente para feedback reativo instantâneo
      const filtered = savedDrafts.filter(d => d.id !== target.id);
      setSavedDrafts(filtered);
      localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(filtered));

      // 2. Remove do Firestore de forma assíncrona
      try {
        await deleteQuoteFromFirestore(target.id);
        logger.info('Orçamentos', `Orçamento #${target.quoteNumber} excluído com sucesso do Firestore.`);
      } catch (firestoreErr: any) {
        logger.warn('Orçamentos', `Aviso ao deletar do Firestore: ${firestoreErr?.message || firestoreErr}`);
      }

      // 3. Sincroniza com Google Sheets se conectado
      if (isConnected) {
        syncAllData().catch(err => console.warn('Falha na sincronização após exclusão:', err));
      }

      showNotification(`Orçamento #${target.quoteNumber} excluído com sucesso.`, 'info');
    } catch (err: any) {
      logger.error('Orçamentos', 'Erro ao excluir orçamento', err?.message || err);
      showNotification('Erro ao excluir o orçamento.', 'error');
    } finally {
      setIsDeleting(false);
      setQuoteToDelete(null);
    }
  };

  // Gerar PDF diretamente de qualquer orçamento da lista
  const handleGeneratePdfFromDraft = async (e: React.MouseEvent, draft: FullDraft) => {
    e.stopPropagation();
    try {
      const clientData = clients.find(c => c.name === draft.clientName);
      const localSettings = localStorage.getItem('@jc-eletricista:company_settings');
      const companySettings = localSettings ? JSON.parse(localSettings) : undefined;
      const subtotalCalc = (draft.items || []).reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);

      await generateQuotePdf({
        quoteNumber: draft.quoteNumber,
        date: draft.date || new Date().toLocaleDateString('pt-BR'),
        clientName: draft.clientName || 'Cliente',
        clientDoc: clientData?.doc,
        clientPhone: clientData?.phone,
        clientEmail: clientData?.email,
        address: draft.address || clientData?.address || '',
        items: draft.items || [],
        subtotal: subtotalCalc,
        discount: draft.discount || 0,
        total: draft.total,
        observations: draft.observations,
        companySettings,
        includeWarranty: includeWarranty,
        documentType: 'orcamento'
      });

      // Atualiza status para 'enviado' se for rascunho
      if (!draft.status || draft.status === 'rascunho') {
        const updatedDraft = { ...draft, status: 'enviado' as const };
        const updated = savedDrafts.map(d => d.id === draft.id ? updatedDraft : d);
        setSavedDrafts(updated);
        localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updated));
        saveQuoteToFirestore(updatedDraft).catch(e => console.warn('Firestore save quote:', e));
      }

      showNotification(`PDF do orçamento #${draft.quoteNumber} gerado com sucesso!`);
    } catch (err) {
      showNotification('Erro ao gerar PDF do orçamento.', 'error');
    }
  };

  // Alternar status manualmente entre Rascunho e Enviado
  const handleToggleStatus = (e: React.MouseEvent, draftId: string, currentStatus?: string) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'enviado' ? 'rascunho' : 'enviado';
    const draftTarget = savedDrafts.find(d => d.id === draftId);
    const updatedDraft = draftTarget ? { ...draftTarget, status: newStatus as any } : null;
    const updated = savedDrafts.map(d => d.id === draftId ? { ...d, status: newStatus as any } : d);
    setSavedDrafts(updated);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updated));
    if (updatedDraft) {
      saveQuoteToFirestore(updatedDraft).catch(e => console.warn('Firestore save quote:', e));
    }
    showNotification(`Status alterado para ${newStatus === 'enviado' ? 'Enviado' : 'Rascunho'}.`, 'info');
  };

  // 3. GERAR PDF COMPATÍVEL COM ANDROID & IOS
  const handleGeneratePdf = async () => {
    if (!selectedClient && items.length === 0) {
      alert('Adicione pelo menos um item ao orçamento antes de gerar o PDF.');
      return;
    }

    const clientData = clients.find(c => c.name === selectedClient);
    const localSettings = localStorage.getItem('@jc-eletricista:company_settings');
    const companySettings = localSettings ? JSON.parse(localSettings) : undefined;

    await generateQuotePdf({
      quoteNumber,
      date: new Date().toLocaleDateString('pt-BR'),
      clientName: selectedClient || 'Cliente',
      clientDoc: clientData?.doc,
      clientPhone: clientData?.phone,
      clientEmail: clientData?.email,
      address: address || clientData?.address || '',
      items,
      subtotal,
      discount,
      total,
      observations,
      companySettings,
      includeWarranty,
      documentType: 'orcamento'
    });

    // Update status to enviado
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('pt-BR');
    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const existingDraftIndex = savedDrafts.findIndex(d => d.quoteNumber === quoteNumber);
    let updatedDrafts = [...savedDrafts];
    let quoteToSave: FullDraft;
    
    if (existingDraftIndex >= 0) {
      quoteToSave = { ...updatedDrafts[existingDraftIndex], status: 'enviado' };
      updatedDrafts[existingDraftIndex] = quoteToSave;
    } else {
      quoteToSave = {
        id: generateItemId('DRAFT'),
        quoteNumber,
        clientName: selectedClient || 'Cliente',
        address,
        items,
        discount,
        observations,
        total,
        date: dateFormatted,
        savedAt: `${dateFormatted} às ${timeFormatted}`,
        status: 'enviado'
      };
      updatedDrafts = [quoteToSave, ...savedDrafts];
    }
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedDrafts));
    saveQuoteToFirestore(quoteToSave).catch(e => console.warn('Firestore save quote:', e));

    showNotification('PDF gerado com sucesso! Arquivo pronto para impressão ou WhatsApp.');
  };

  // Print screen handler updating status to enviado
  const handlePrintScreen = () => {
    // Update status to enviado
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('pt-BR');
    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const existingDraftIndex = savedDrafts.findIndex(d => d.quoteNumber === quoteNumber);
    let updatedDrafts = [...savedDrafts];
    let quoteToSave: FullDraft;
    
    if (existingDraftIndex >= 0) {
      quoteToSave = { ...updatedDrafts[existingDraftIndex], status: 'enviado' };
      updatedDrafts[existingDraftIndex] = quoteToSave;
    } else {
      quoteToSave = {
        id: generateItemId('DRAFT'),
        quoteNumber,
        clientName: selectedClient || 'Cliente',
        address,
        items,
        discount,
        observations,
        total,
        date: dateFormatted,
        savedAt: `${dateFormatted} às ${timeFormatted}`,
        status: 'enviado'
      };
      updatedDrafts = [quoteToSave, ...savedDrafts];
    }
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedDrafts));
    saveQuoteToFirestore(quoteToSave).catch(e => console.warn('Firestore save quote:', e));
    
    window.print();
  };

  const filteredCatalog = catalogItems.filter(item =>
    item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold ${
            notification.type === 'success' ? 'bg-[#141418] border-emerald-500/50 text-emerald-400' :
            notification.type === 'error' ? 'bg-[#141418] border-red-500/50 text-red-400' :
            'bg-[#141418] border-[#FF7A00]/50 text-[#FF7A00]'
          }`}>
            <Check size={16} />
            <span>{notification.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Novo Orçamento</h1>
            <span className="bg-[#1e1e24] text-[#FF7A00] border border-[#2d2d38] text-[11px] font-mono font-bold px-2 py-0.5 rounded">
              Nº {quoteNumber}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">Monte orçamentos com tabela de preços, salve rascunhos e exporte PDF para Android e iOS.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Botão Ver Lista / Histórico */}
          <button
            type="button"
            onClick={() => setIsDraftsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-[#141418] hover:bg-[#1f1f26] text-zinc-300 hover:text-white border border-[#2d2d38] px-3.5 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.98]"
          >
            <History size={15} className="text-[#FF7A00]" />
            <span>Orçamentos Salvos ({savedDrafts.length})</span>
          </button>

          {/* Salvar Rascunho */}
          <button 
            type="button"
            onClick={handleSaveDraft}
            disabled={isSyncing}
            className="flex items-center justify-center gap-1.5 border border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00]/10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSyncing ? <Cloud size={15} className="animate-pulse" /> : <Save size={15} />}
            {isSyncing ? 'Salvando...' : 'Salvar Rascunho'}
          </button>
          
          {/* Pré-visualizar Orçamento (Apenas Conferir - Não Salva) */}
          <button 
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-[#FF7A00] hover:bg-[#FF8A00] text-black px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-[#FF7A00]/20"
          >
            <Eye size={16} />
            Pré-visualizar Orçamento
          </button>
        </div>
      </header>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Form Editor (Left Column) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">

          {/* Client Details Card */}
          <section className="bg-surface-container rounded border border-outline-variant p-5">
            <h2 className="text-sm font-bold text-on-surface mb-3.5 flex items-center gap-2">
              <User className="text-primary" size={18} />
              Dados do Cliente & Local
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Cliente / Empresa</label>
                <select 
                  className="w-full bg-surface-container-high border border-outline-variant rounded p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                  value={selectedClient}
                  onChange={handleClientChange}
                >
                  <option value="">Selecione um cliente cadastrado...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.name}>{c.name} {c.doc ? `(${c.doc})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Local da Obra / Serviço</label>
                <input 
                  type="text" 
                  className="w-full bg-surface-container-high border border-outline-variant rounded p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors" 
                  placeholder="Rua, Número, Bairro, Cidade" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Service Items Card */}
          <section className="bg-surface-container rounded border border-outline-variant p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <Wrench className="text-primary" size={18} />
                Itens do Orçamento ({items.length})
              </h2>

              {/* Botão de Catálogo de Itens */}
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(true)}
                className="self-start sm:self-auto bg-[#18181c] hover:bg-[#242429] border border-[#FF7A00]/40 text-[#FF7A00] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
              >
                <BookOpen size={14} />
                Tabela de Serviços Cadastrados
              </button>
            </div>
            
            <div className="bg-background rounded border border-outline-variant overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-surface-container-highest border-b border-outline-variant text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                    <th className="p-3 w-16">ID</th>
                    <th className="p-3">Descrição do Serviço / Material</th>
                    <th className="p-3 w-20 text-center">Qtd</th>
                    <th className="p-3 w-28 text-right">V. Unitário</th>
                    <th className="p-3 w-28 text-right">Total</th>
                    <th className="p-3 w-10 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-high transition-colors group">
                      <td className="p-3 font-mono text-[10px] text-zinc-500 font-bold">{item.id}</td>
                      <td className="p-3 text-xs text-on-surface font-medium">{item.description}</td>
                      <td className="p-3 text-xs text-on-surface text-center font-mono">{item.quantity}</td>
                      <td className="p-3 text-xs text-on-surface text-right font-mono">R$ {formatCurrency(item.unitPrice)}</td>
                      <td className="p-3 text-xs text-[#FF7A00] font-bold text-right font-mono">R$ {formatCurrency(item.quantity * item.unitPrice)}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleRemoveItem(item.id)} 
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                          title="Remover Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* New Item Input Row */}
                  <tr className="bg-surface-container-highest/50">
                    <td className="p-2 text-[10px] text-zinc-500 text-center font-bold font-mono">NOVO</td>
                    <td className="p-2">
                      <input 
                        type="text" 
                        placeholder="Digite o serviço ou clique em 'Tabela de Serviços'..." 
                        className="w-full bg-surface-container-high border border-outline-variant focus:border-primary rounded px-3 py-2 text-on-surface text-xs outline-none"
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddItem();
                        }}
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        min="1"
                        className="w-full bg-surface-container-high border border-outline-variant focus:border-primary rounded px-2 py-2 text-on-surface text-xs outline-none text-center font-mono"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value) || 1})}
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full bg-surface-container-high border border-outline-variant focus:border-primary rounded px-2 py-2 text-on-surface text-xs outline-none text-right font-mono"
                        value={newItem.unitPrice || ''}
                        onChange={(e) => setNewItem({...newItem, unitPrice: Number(e.target.value) || 0})}
                      />
                    </td>
                    <td className="p-2 text-right text-xs font-bold text-on-surface-variant font-mono px-3 py-2">
                      R$ {formatCurrency((newItem.quantity || 1) * (newItem.unitPrice || 0))}
                    </td>
                    <td className="p-2 text-center">
                      <button 
                        onClick={handleAddItem} 
                        disabled={!newItem.description.trim()} 
                        className="text-primary hover:text-[#FF8A00] transition-colors disabled:opacity-30 p-1"
                        title="Adicionar Item"
                      >
                        <PlusCircle size={22} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mt-2">
              <div className="w-full sm:w-72 bg-surface-container-high p-4 rounded-xl border border-outline-variant space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-on-surface-variant uppercase tracking-wider text-[10px]">Subtotal:</span>
                  <span className="text-on-surface font-mono font-semibold">R$ {formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-on-surface-variant uppercase tracking-wider text-[10px]">Desconto (R$):</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="w-24 bg-surface-container-highest border border-outline-variant focus:border-primary rounded px-2 py-1 text-on-surface text-xs outline-none text-right font-mono" 
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="pt-2 border-t border-outline-variant flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-white tracking-wider">Total Geral:</span>
                  <span className="text-lg font-black text-primary font-mono">R$ {formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Observations */}
          <section className="bg-[#0e0e11] rounded-2xl border border-[#202028] p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <AlignLeft className="text-[#FF7A00]" size={16} />
                Observações & Condições de Pagamento
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono">
                Texto incluído no PDF / Prévia
              </span>
            </div>
            <textarea 
              rows={4}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-[#141418] border border-[#262630] rounded-xl p-3.5 text-xs text-zinc-200 focus:outline-none focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00]/30 transition-all placeholder:text-zinc-500 leading-relaxed font-sans resize-y" 
              placeholder="Validade do orçamento, prazos, formas de pagamento, garantia..."
            />
          </section>

          {/* Opção de Termo de Garantia no Orçamento */}
          <section className="bg-[#0e0e11] rounded-2xl border border-[#202028] p-4 shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF7A00]/10 border border-[#FF7A00]/20 flex items-center justify-center text-[#FF7A00] shrink-0">
                <BookOpen size={18} />
              </div>
              <div>
                <label htmlFor="include-warranty-checkbox" className="text-xs font-bold text-white cursor-pointer select-none block">
                  Adicionar termo de garantia no orçamento?
                </label>
                <p className="text-[11px] text-zinc-400">
                  {includeWarranty 
                    ? 'Sim • Gera a 2ª página com os termos jurídicos e normas ABNT NBR 5410 / NR-10.' 
                    : 'Não • O orçamento será gerado em página única sem os termos de garantia.'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                id="include-warranty-checkbox"
                type="checkbox" 
                checked={includeWarranty}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIncludeWarranty(checked);
                  if (!checked && previewTab === 'garantia') {
                    setPreviewTab('orcamento');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#202028] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7A00]"></div>
            </label>
          </section>
        </div>

        {/* Live Preview (Right Column) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
          <div className="bg-surface-container rounded border border-outline-variant overflow-hidden flex flex-col shadow-2xl shadow-black/60">
            {/* Preview Header */}
            <div className="bg-surface-container-highest p-3 border-b border-outline-variant flex justify-between items-center shrink-0">
              <div className="flex items-center gap-1 bg-[#141418] p-1 rounded-lg border border-[#27272e]">
                <button
                  type="button"
                  onClick={() => setPreviewTab('orcamento')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    previewTab === 'orcamento'
                      ? 'bg-[#FF7A00] text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Pág 1: Orçamento
                </button>
                {includeWarranty ? (
                  <button
                    type="button"
                    onClick={() => setPreviewTab('garantia')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                      previewTab === 'garantia'
                        ? 'bg-[#FF7A00] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Pág 2: Termos de Garantia
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIncludeWarranty(true);
                      setPreviewTab('garantia');
                    }}
                    title="Clique para ativar e visualizar os termos de garantia"
                    className="px-2.5 py-1 rounded text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-all border border-dashed border-zinc-700/50"
                  >
                    + Ativar Pág 2
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintScreen}
                  title="Imprimir tela"
                  className="p-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <Printer size={15} />
                </button>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-primary/20">
                  {includeWarranty 
                    ? (previewTab === 'orcamento' ? '1/2 Timbrado' : '2/2 Garantia')
                    : '1/1 Orçamento'}
                </span>
              </div>
            </div>
            
            {/* "Paper" Area */}
            <div className="p-5 bg-white text-gray-900 m-3 rounded-lg shadow-inner border border-gray-300 text-[11px] leading-tight select-none min-h-[480px] flex flex-col justify-between">
              
              {previewTab === 'orcamento' ? (
                <div>
                  {/* Header Box */}
                  <div className="flex items-center justify-between border-b-2 border-gray-900 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getAssetUrl('/logo.svg')} 
                        alt="Logo JC Eletricista" 
                        className="w-12 h-12 rounded-lg object-contain shrink-0 shadow-sm border border-[#26262e] bg-[#0c0c0f]" 
                      />
                      <div>
                        <h1 className="text-sm font-black uppercase text-gray-900 tracking-tight">JC ELETRICISTA</h1>
                        <p className="text-[9px] text-[#ea580c] font-bold">Serviços Elétricos Profissionais</p>
                        <p className="text-[8px] text-gray-500">Residencial • Comercial • Padrão</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-gray-900 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase">Orçamento</span>
                      <p className="text-[9px] text-gray-600 font-mono mt-1">Nº {quoteNumber}</p>
                      <p className="text-[8px] text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="bg-gray-50 p-2.5 rounded border border-gray-200 mb-3">
                    <p className="text-[8px] font-bold uppercase text-gray-400">Cliente / Local:</p>
                    <p className="text-xs font-bold text-gray-900">{selectedClient || 'Nome do Cliente'}</p>
                    <p className="text-[9px] text-gray-600 truncate">{address || 'Endereço da Obra'}</p>
                  </div>

                  {/* Items Table */}
                  <table className="w-full text-[9px] text-left mb-3">
                    <thead className="border-b border-gray-300 text-gray-500 uppercase">
                      <tr>
                        <th className="py-1">Item</th>
                        <th className="py-1 text-center">Qtd</th>
                        <th className="py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-800 divide-y divide-gray-100">
                      {items.length > 0 ? items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-1 pr-1 font-medium">{idx + 1}. {item.description}</td>
                          <td className="py-1 text-center font-mono">{item.quantity}</td>
                          <td className="py-1 text-right font-mono font-semibold">R$ {formatCurrency(item.quantity * item.unitPrice)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={3} className="py-3 text-center text-gray-400 italic">Nenhum item adicionado.</td></tr>
                      )}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end border-t border-gray-300 pt-2 mb-3">
                    <div className="w-40 text-right space-y-1">
                      <div className="flex justify-between text-[9px] text-gray-600">
                        <span>Subtotal:</span>
                        <span>R$ {formatCurrency(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-[9px] text-red-600">
                          <span>Desconto:</span>
                          <span>- R$ {formatCurrency(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs font-black text-gray-900 border-t border-gray-200 pt-1">
                        <span>Total:</span>
                        <span className="text-[#ea580c]">R$ {formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Observations & Terms */}
                  {observations && (
                    <div className="mb-3 pt-2 border-t border-gray-200 text-[8px] text-gray-600 leading-tight">
                      <p className="font-bold uppercase text-gray-400 mb-0.5">Observações & Condições:</p>
                      <p className="whitespace-pre-line">{observations}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Header Box Garantia */}
                  <div className="flex items-center justify-between border-b-2 border-gray-900 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-black border border-[#FF7A00]/40 flex flex-col items-center justify-center p-1 shrink-0 shadow-sm text-center">
                        <span className="font-black italic text-base leading-none text-[#FF7A00]">JC</span>
                        <span className="text-[5px] font-black text-white uppercase tracking-wider mt-0.5">ELETRICISTA</span>
                        <span className="text-[4px] text-[#FF7A00] leading-none">residencial/comercial</span>
                      </div>
                      <div>
                        <h1 className="text-sm font-black uppercase text-gray-900 tracking-tight">TERMO DE GARANTIA</h1>
                        <p className="text-[9px] text-[#ea580c] font-bold">ABNT NBR 5410 & NR-10</p>
                        <p className="text-[8px] text-gray-500">47 99706-4183 • jc_eletricistajoinville</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-[#ea580c] text-white font-black text-[8px] px-2 py-0.5 rounded uppercase">Certificado</span>
                      <p className="text-[9px] text-gray-600 font-mono mt-1">Ref: {quoteNumber}</p>
                      <p className="text-[8px] text-gray-500">Pág 2 de 2</p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="bg-gray-50 p-2 rounded border border-gray-200 mb-2.5 text-[8px]">
                    <span className="font-bold text-gray-700">Contratante:</span> <span className="text-gray-900 font-semibold">{selectedClient || 'Cliente'}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="font-bold text-gray-700">Local:</span> <span className="text-gray-600">{address || 'Conforme orçamento'}</span>
                  </div>

                  {/* Clauses List */}
                  <div className="space-y-2 text-[8px] text-gray-700 leading-snug border border-gray-200 rounded p-2.5 bg-gray-50/50 mb-3">
                    <div>
                      <p className="font-bold text-[#ea580c]">1. PRAZO E COBERTURA LEGAL</p>
                      <p className="text-gray-600">Garantia legal de 90 (noventa) dias sobre a mão de obra especializada conforme Art. 26 do CDC.</p>
                    </div>
                    <div>
                      <p className="font-bold text-[#ea580c]">2. NORMAS TÉCNICAS APLICADAS</p>
                      <p className="text-gray-600">Execução rigorosa em conformidade com as normas ABNT NBR 5410 e NR-10 de segurança.</p>
                    </div>
                    <div>
                      <p className="font-bold text-[#ea580c]">3. CONDIÇÕES PARA VALIDADE</p>
                      <p className="text-gray-600">Utilização de materiais certificados INMETRO e respeito ao dimensionamento dos disjuntores e condutores.</p>
                    </div>
                    <div>
                      <p className="font-bold text-[#ea580c]">4. EXCLUSÕES DE COBERTURA</p>
                      <p className="text-gray-600">Intervenções de terceiros não autorizados, sobrecargas não previstas e descargas atmosféricas sem DPS.</p>
                    </div>
                    <div>
                      <p className="font-bold text-[#ea580c]">5. SUPORTE TÉCNICO</p>
                      <p className="text-gray-600">Acionamento imediato via WhatsApp oficial (47 99706-4183) para vistoria e assistência prioritária.</p>
                    </div>
                  </div>

                  {/* Signatures preview */}
                  <div className="pt-2 border-t border-gray-200 flex justify-between text-[7px] text-gray-500 text-center">
                    <div className="w-28 border-t border-gray-400 pt-1">JC ELETRICISTA</div>
                    <div className="w-28 border-t border-gray-400 pt-1">Cliente / Aceite</div>
                  </div>
                </div>
              )}

              {/* Preview CTA */}
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="w-full bg-[#FF7A00] hover:bg-[#FF8A00] text-black py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF7A00]/20 active:scale-[0.98] mt-3"
              >
                <Eye size={15} />
                Pré-visualizar Orçamento
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: RESTAURAR RASCUNHO / HISTÓRICO DE ORÇAMENTOS */}
      {isDraftsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141418] border border-[#292930] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-[#242429]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <History size={18} className="text-[#FF7A00]" />
                <span>Histórico de Orçamentos ({savedDrafts.length})</span>
              </div>
              <button
                onClick={() => setIsDraftsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Abas e Filtro no Modal */}
            <div className="p-4 border-b border-[#242429] bg-[#0e0e11] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex items-center bg-[#141418] p-1 rounded-xl border border-[#202028] gap-1">
                <button
                  type="button"
                  onClick={() => setListFilter('todos')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    listFilter === 'todos'
                      ? 'bg-[#FF7A00] text-black shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Todos ({stats.totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('rascunhos')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    listFilter === 'rascunhos'
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Clock size={12} />
                  Rascunhos ({stats.rascunhosCount})
                </button>
                <button
                  type="button"
                  onClick={() => setListFilter('enviados')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    listFilter === 'enviados'
                      ? 'bg-blue-500 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Send size={12} />
                  Enviados ({stats.enviadosCount})
                </button>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Pesquisar orçamento..."
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  className="w-full bg-[#141418] border border-[#28282e] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {filteredQuotesList.length > 0 ? (
                filteredQuotesList.map(draft => {
                  const isSent = draft.status === 'enviado' || draft.status === 'pedido' || draft.status === 'concluido';
                  return (
                    <div 
                      key={draft.id} 
                      className="p-4 bg-[#0e0e11] hover:bg-[#18181f] border border-[#242429] hover:border-[#FF7A00]/40 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate">{draft.clientName}</h4>
                          <span className="text-[10px] font-mono text-zinc-500 bg-[#1c1c24] px-1.5 py-0.5 rounded border border-[#2a2a38]">
                            #{draft.quoteNumber}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                            draft.status === 'pedido'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : draft.status === 'concluido'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : isSent 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {draft.status === 'pedido' ? 'O.S. Aprovada' : draft.status === 'concluido' ? 'Concluído' : isSent ? 'Enviado' : 'Rascunho'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 truncate">
                          {draft.items?.length || 0} itens: {draft.items?.map(i => i.description).join(', ') || 'Sem descrição'}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1">
                          <span>Salvo em {draft.savedAt || draft.date}</span>
                          {draft.address && <span className="truncate max-w-[200px]">{draft.address}</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#242429]">
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-bold text-[#FF7A00] font-mono">
                            R$ {formatCurrency(draft.total)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRestoreDraft(draft)}
                            className="bg-[#202028] hover:bg-[#FF7A00] text-zinc-300 hover:text-black px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                            title="Carregar no formulário"
                          >
                            <FileEdit size={12} />
                            Resgatar
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleGeneratePdfFromDraft(e, draft)}
                            className="bg-[#202028] hover:bg-[#2e2e3a] text-white hover:text-[#FF7A00] p-1.5 rounded-lg text-[10px] font-bold transition-colors border border-[#2e2e3a]"
                            title="Baixar PDF"
                          >
                            <FileDown size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(e, draft.id, draft.status)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                              isSent
                                ? 'text-zinc-400 hover:text-amber-400 hover:bg-[#202028]'
                                : 'text-zinc-400 hover:text-blue-400 hover:bg-[#202028]'
                            }`}
                            title={isSent ? 'Mudar status para Rascunho' : 'Mudar status para Enviado'}
                          >
                            {isSent ? <Clock size={13} /> : <Send size={13} />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteDraft(e, draft)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-[#25252e] rounded-lg transition-colors active:scale-95"
                            title="Excluir Orçamento"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full p-8 text-center text-zinc-400 text-xs bg-[#0e0e11] rounded-xl border border-dashed border-[#24242f] flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1c1c24] flex items-center justify-center text-zinc-500 shrink-0">
                    <History size={16} />
                  </div>
                  <p className="w-full text-center text-zinc-300 font-semibold">
                    Nenhum orçamento salvo ainda.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#0e0e11] border-t border-[#242429] flex justify-end">
              <button
                type="button"
                onClick={() => setIsDraftsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-[#18181c] rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SELECIONAR DO CATÁLOGO DE SERVIÇOS */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141418] border border-[#292930] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-5 border-b border-[#242429]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <BookOpen size={18} className="text-[#FF7A00]" />
                <span>Tabela de Serviços & Materiais Cadastrados</span>
              </div>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
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

            {/* Catalog List */}
            <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2">
              {filteredCatalog.length > 0 ? (
                filteredCatalog.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectFromCatalog(item)}
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
                      <span className="text-xs font-bold text-[#FF7A00] font-mono">
                        R$ {formatCurrency(item.unitPrice)}
                      </span>
                      <span className="text-[10px] text-zinc-500 ml-1 font-mono">/{item.unit}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  Nenhum item encontrado com esse termo.
                </div>
              )}
            </div>

            <div className="p-4 bg-[#0e0e11] border-t border-[#242429] flex justify-between items-center">
              <span className="text-[11px] text-zinc-500">
                Dica: Você pode cadastrar novos itens na aba <strong>Configurações</strong>.
              </span>
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-[#18181c] rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO COMPLETA (MODO CONFERÊNCIA - NÃO SALVA NADA) */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#121216] border border-[#262630] rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            
            {/* Header da Barra de Pré-Visualização */}
            <div className="p-4 sm:p-5 border-b border-[#22222a] bg-[#0c0c0f] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF7A00]/10 border border-[#FF7A00]/25 flex items-center justify-center text-[#FF7A00] shrink-0">
                  <Eye size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-white">Pré-Visualização do Orçamento</h2>
                    <span className="text-xs font-mono text-zinc-400 bg-[#181820] px-2 py-0.5 rounded border border-[#2a2a38]">
                      #{quoteNumber}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                      Modo Conferência • Não salva
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Confira todos os dados e formatações antes de emitir ou enviar ao cliente.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* Seletor de Páginas no Modal */}
                <div className="flex items-center bg-[#181820] p-1 rounded-xl border border-[#262632] gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewModalPage('ambas')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      previewModalPage === 'ambas'
                        ? 'bg-[#FF7A00] text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {includeWarranty ? 'Ambas as Páginas (2)' : 'Documento (1 Pág)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewModalPage('orcamento')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      previewModalPage === 'orcamento'
                        ? 'bg-[#FF7A00] text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Pág 1: Orçamento
                  </button>
                  {includeWarranty && (
                    <button
                      type="button"
                      onClick={() => setPreviewModalPage('garantia')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        previewModalPage === 'garantia'
                          ? 'bg-[#FF7A00] text-black shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Pág 2: Garantia
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1f1f28] transition-colors"
                  title="Fechar Pré-Visualização"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Conteúdo de Conferência (Scrollável e Formato Folha A4 Real) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#09090c] space-y-6 flex flex-col items-center">
              
              {/* PÁGINA 1: ORÇAMENTO TIMBRADO */}
              {(previewModalPage === 'ambas' || previewModalPage === 'orcamento') && (
                <div className="w-full max-w-[760px] bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-300 p-6 sm:p-10 select-none text-[11px] leading-tight">
                  
                  {/* Cabeçalho Oficial */}
                  <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4 mb-4">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={getAssetUrl('/logo.svg')} 
                        alt="Logo JC Eletricista" 
                        className="w-14 h-14 rounded-lg object-contain shrink-0 shadow-sm border border-[#26262e] bg-[#0c0c0f]" 
                      />
                      <div>
                        <h1 className="text-base font-black uppercase text-gray-900 tracking-tight leading-none">JC ELETRICISTA</h1>
                        <p className="text-[10px] text-[#ea580c] font-bold mt-1">Serviços Elétricos Profissionais & Manutenção</p>
                        <p className="text-[9px] text-gray-500">Residencial • Comercial • Padrão de Entrada • NR-10</p>
                        <p className="text-[8px] text-gray-400 mt-0.5">WhatsApp: (47) 99706-4183 • Joinville - SC</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-gray-900 text-white font-black text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                        Orçamento
                      </span>
                      <p className="text-xs text-gray-800 font-mono font-bold mt-1.5">Nº {quoteNumber}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                      <p className="text-[8px] text-amber-700 font-bold mt-0.5">Validade: 15 dias corridos</p>
                    </div>
                  </div>

                  {/* Informações do Cliente */}
                  <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <p className="text-[8px] font-bold uppercase text-gray-400">Cliente / Contratante:</p>
                        <p className="text-xs font-bold text-gray-900 mt-0.5">{selectedClient || 'Nome do Cliente não selecionado'}</p>
                        {(() => {
                          const clientData = clients.find(c => c.name === selectedClient);
                          return (
                            <>
                              {clientData?.doc && <p className="text-gray-600">CPF/CNPJ: {clientData.doc}</p>}
                              {clientData?.phone && <p className="text-gray-600">Telefone: {clientData.phone}</p>}
                              {clientData?.email && <p className="text-gray-600">E-mail: {clientData.email}</p>}
                            </>
                          );
                        })()}
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase text-gray-400">Local da Obra / Instalação:</p>
                        <p className="text-gray-800 font-medium mt-0.5">{address || 'Endereço não informado'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Itens e Serviços */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-gray-100 border-b border-gray-300 text-gray-600 uppercase text-[9px] font-bold">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center">#</th>
                          <th className="py-2 px-3">Descrição dos Serviços / Materiais</th>
                          <th className="py-2 px-3 text-center w-16">Qtd</th>
                          <th className="py-2 px-3 text-right w-24">Vlr. Unit.</th>
                          <th className="py-2 px-3 text-right w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.length > 0 ? (
                          items.map((item, idx) => (
                            <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className="py-2 px-3 text-center font-mono text-gray-500">{idx + 1}</td>
                              <td className="py-2 px-3 font-medium text-gray-900">{item.description}</td>
                              <td className="py-2 px-3 text-center font-mono text-gray-700">{item.quantity}</td>
                              <td className="py-2 px-3 text-right font-mono text-gray-700">R$ {formatCurrency(item.unitPrice)}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                                R$ {formatCurrency(item.quantity * item.unitPrice)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-gray-400 italic">
                              Nenhum item adicionado ao orçamento até o momento.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Quadro de Totais */}
                  <div className="flex justify-end mb-4">
                    <div className="w-64 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1.5 text-[10px]">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal dos Serviços:</span>
                        <span className="font-mono">R$ {formatCurrency(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-red-600 font-semibold">
                          <span>Desconto Concedido:</span>
                          <span className="font-mono">- R$ {formatCurrency(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs font-black text-gray-900 border-t border-gray-200 pt-1.5">
                        <span className="uppercase">Valor Total:</span>
                        <span className="text-[#ea580c] font-mono text-sm">R$ {formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Observações e Condições */}
                  {observations && (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3 text-[9px] text-gray-700 mb-4 leading-relaxed">
                      <p className="font-bold uppercase text-amber-900 mb-1">Observações & Condições Gerais:</p>
                      <p className="whitespace-pre-line text-gray-800">{observations}</p>
                    </div>
                  )}

                  {/* Assinaturas */}
                  <div className="pt-4 border-t border-gray-300 flex justify-between text-[8px] text-gray-500 text-center gap-8">
                    <div className="flex-1 border-t border-gray-400 pt-1">
                      <p className="font-bold text-gray-800">JC ELETRICISTA</p>
                      <p className="text-[7px]">Responsável Técnico</p>
                    </div>
                    <div className="flex-1 border-t border-gray-400 pt-1">
                      <p className="font-bold text-gray-800">{selectedClient || 'Cliente'}</p>
                      <p className="text-[7px]">Aceite e Autorização do Serviço</p>
                    </div>
                  </div>

                  <div className="text-center text-[7px] text-gray-400 mt-4">
                    Página 1 de {includeWarranty ? '2' : '1'} • Orçamento #{quoteNumber}
                  </div>
                </div>
              )}

              {/* PÁGINA 2: TERMO DE GARANTIA (SE ATIVADO) */}
              {includeWarranty && (previewModalPage === 'ambas' || previewModalPage === 'garantia') && (
                <div className="w-full max-w-[760px] bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-300 p-6 sm:p-10 select-none text-[11px] leading-tight">
                  
                  {/* Cabeçalho da Garantia */}
                  <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-lg bg-black border border-[#FF7A00]/40 flex flex-col items-center justify-center p-1 shrink-0 shadow-sm text-center">
                        <span className="font-black italic text-lg leading-none text-[#FF7A00]">JC</span>
                        <span className="text-[6px] font-black text-white uppercase tracking-wider mt-0.5">ELETRICISTA</span>
                        <span className="text-[5px] text-[#FF7A00] leading-none">profissional</span>
                      </div>
                      <div>
                        <h1 className="text-base font-black uppercase text-gray-900 tracking-tight leading-none">CERTIFICADO DE GARANTIA</h1>
                        <p className="text-[10px] text-[#ea580c] font-bold mt-1">Conformidade Técnica ABNT NBR 5410 & NR-10</p>
                        <p className="text-[9px] text-gray-500">Garantia Técnica sobre a Execução de Serviços Elétricos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-[#ea580c] text-white font-black text-[10px] px-2.5 py-1 rounded uppercase tracking-wider">
                        Garantia
                      </span>
                      <p className="text-xs text-gray-800 font-mono font-bold mt-1.5">Ref: #{quoteNumber}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">Página 2 de 2</p>
                    </div>
                  </div>

                  {/* Informações do Contrato de Garantia */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 text-[9px]">
                    <span className="font-bold text-gray-700">Contratante:</span> <span className="text-gray-900 font-bold">{selectedClient || 'Cliente'}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="font-bold text-gray-700">Local da Execução:</span> <span className="text-gray-700">{address || 'Conforme especificado no orçamento'}</span>
                  </div>

                  {/* Cláusulas Técnicas Detalhadas */}
                  <div className="space-y-3 text-[9px] text-gray-700 leading-relaxed border border-gray-200 rounded-lg p-4 bg-gray-50/50 mb-4">
                    <div>
                      <p className="font-bold text-[#ea580c]">1. PRAZO E COBERTURA LEGAL DA GARANTIA</p>
                      <p className="text-gray-600 mt-0.5">
                        A JC ELETRICISTA assegura garantia legal e técnica de 90 (noventa) dias corridos sobre toda a mão de obra especializada executada nesta proposta, em estrito cumprimento ao Artigo 26, inciso II, da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor).
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-[#ea580c]">2. NORMAS TÉCNICAS E SEGURANÇA OPERACIONAL</p>
                      <p className="text-gray-600 mt-0.5">
                        Os serviços foram planejados e executados em rigorosa consonância com os parâmetros da norma ABNT NBR 5410 (Instalações Elétricas de Baixa Tensão) e diretrizes de segurança da NR-10 do Ministério do Trabalho e Emprego.
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-[#ea580c]">3. CONDIÇÕES PARA VALIDADE DA GARANTIA</p>
                      <p className="text-gray-600 mt-0.5">
                        A cobertura permanece válida mediante uso exclusivo de condutores, disjuntores e dispositivos certificados pelo INMETRO, respeitando integralmente as capacidades de corrente e carga calculadas pelo responsável técnico.
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-[#ea580c]">4. EXCLUSÕES DE COBERTURA</p>
                      <p className="text-gray-600 mt-0.5">
                        A garantia não abrange falhas decorrentes de intervenções de terceiros não autorizados, sobrecargas não dimensionadas posteriormente, sinistros por infiltrações de água ou descargas atmosféricas em circuitos desprovidos de Dispositivos de Proteção contra Surtos (DPS).
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-[#ea580c]">5. SUPORTE TÉCNICO E ACIONAMENTO PRIORITÁRIO</p>
                      <p className="text-gray-600 mt-0.5">
                        Havendo qualquer dúvida operacional ou necessidade de suporte técnico, o cliente dispõe de atendimento prioritário via WhatsApp oficial (47 99706-4183).
                      </p>
                    </div>
                  </div>

                  {/* Assinaturas do Certificado */}
                  <div className="pt-4 border-t border-gray-300 flex justify-between text-[8px] text-gray-500 text-center gap-8">
                    <div className="flex-1 border-t border-gray-400 pt-1">
                      <p className="font-bold text-gray-800">JC ELETRICISTA</p>
                      <p className="text-[7px]">Emissor e Responsável Técnico</p>
                    </div>
                    <div className="flex-1 border-t border-gray-400 pt-1">
                      <p className="font-bold text-gray-800">{selectedClient || 'Cliente'}</p>
                      <p className="text-[7px]">Recebimento do Certificado</p>
                    </div>
                  </div>

                  <div className="text-center text-[7px] text-gray-400 mt-4">
                    Página 2 de 2 • Certificado de Garantia • Orçamento #{quoteNumber}
                  </div>
                </div>
              )}

            </div>

            {/* Barra Inferior de Ações do Modal de Conferência */}
            <div className="p-4 bg-[#0c0c0f] border-t border-[#22222a] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Nenhuma alteração foi salva. Você pode voltar e ajustar qualquer item.</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-[#1a1a22] hover:bg-[#242430] border border-[#2a2a38] rounded-xl transition-all"
                >
                  Voltar para Edição
                </button>

                <button
                  type="button"
                  onClick={handlePrintScreen}
                  className="px-3.5 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-[#1a1a22] hover:bg-[#242430] border border-[#2a2a38] rounded-xl transition-all flex items-center gap-1.5"
                  title="Imprimir visualização"
                >
                  <Printer size={14} />
                  Imprimir
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    handleGeneratePdf();
                  }}
                  className="px-4 py-2 text-xs font-black text-black bg-[#FF7A00] hover:bg-[#FF8A00] rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-[#FF7A00]/20 active:scale-[0.98]"
                >
                  <FileDown size={14} />
                  Baixar PDF Oficial
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE ORÇAMENTO */}
      {quoteToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141418] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Excluir Orçamento</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <div className="bg-[#0e0e11] p-3.5 rounded-xl border border-[#242429] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Número:</span>
                <span className="font-mono font-bold text-white">#{quoteToDelete.quoteNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Cliente:</span>
                <span className="font-bold text-zinc-200 truncate max-w-[200px]">{quoteToDelete.clientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Valor Total:</span>
                <span className="font-mono font-bold text-[#FF7A00]">R$ {formatCurrency(quoteToDelete.total)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#222228]">
              <button
                type="button"
                onClick={() => setQuoteToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-[#1e1e26] hover:bg-[#282834] rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
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
    </>
  );
}

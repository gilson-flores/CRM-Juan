'use client';

import { useState, useEffect } from 'react';
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
  BookOpen
} from 'lucide-react';
import type { Client } from '../clientes/page';
import { useGoogleSheets, CatalogItem, DEFAULT_CATALOG_ITEMS } from '@/hooks/useGoogleSheets';
import { generateQuotePdf } from '@/lib/generatePdf';

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
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(DEFAULT_CATALOG_ITEMS);
  
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

  // Modais
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const savedClients = localStorage.getItem('@jc-eletricista:clients');
    const savedDraftsList = localStorage.getItem('@jc-eletricista:saved_drafts_v2');
    const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');

    const timer = setTimeout(() => {
      // Gerar número de orçamento inicial caso seja padrão
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setQuoteNumber(`2026-${randomSuffix}`);

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

    return () => clearTimeout(timer);
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
      savedAt: `${dateFormatted} às ${timeFormatted}`
    };

    // Atualizar lista de rascunhos
    const updatedDrafts = [newDraft, ...savedDrafts.filter(d => d.id !== draftId)];
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedDrafts));

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
  };

  const handleDeleteDraft = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja excluir este rascunho?')) {
      const filtered = savedDrafts.filter(d => d.id !== id);
      setSavedDrafts(filtered);
      localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(filtered));
      showNotification('Rascunho excluído.', 'info');
    }
  };

  // 3. GERAR PDF COMPATÍVEL COM ANDROID & IOS
  const handleGeneratePdf = async () => {
    if (!selectedClient && items.length === 0) {
      alert('Adicione pelo menos um item ao orçamento antes de gerar o PDF.');
      return;
    }

    const clientData = clients.find(c => c.name === selectedClient);

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
      observations
    });

    // Update status to enviado
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('pt-BR');
    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const existingDraftIndex = savedDrafts.findIndex(d => d.quoteNumber === quoteNumber);
    let updatedDrafts = [...savedDrafts];
    
    if (existingDraftIndex >= 0) {
      updatedDrafts[existingDraftIndex] = { ...updatedDrafts[existingDraftIndex], status: 'enviado' };
    } else {
      updatedDrafts = [{
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
      }, ...savedDrafts];
    }
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updatedDrafts));

    showNotification('PDF gerado com sucesso! Arquivo pronto para impressão ou WhatsApp.');
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
          {/* Salvar Rascunho */}
          <button 
            type="button"
            onClick={handleSaveDraft}
            disabled={isSyncing}
            className="flex items-center justify-center gap-1.5 border border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00]/10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {isSyncing ? <Cloud size={15} className="animate-pulse" /> : <Save size={15} />}
            {isSyncing ? 'Salvando...' : 'Salvar Rascunho'}
          </button>
          
          {/* Gerar PDF / Imprimir (Android & iOS) */}
          <button 
            type="button"
            onClick={handleGeneratePdf}
            className="flex items-center justify-center gap-1.5 bg-[#FF7A00] hover:bg-[#FF8A00] text-black px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-[#FF7A00]/20"
          >
            <FileDown size={16} />
            Baixar / Imprimir PDF
          </button>
        </div>
      </header>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Form Editor (Left Column) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          
          {/* Rascunhos Salvos Area */}
          {savedDrafts.length > 0 && (
            <section className="bg-surface-container rounded border border-outline-variant p-4">
              <h2 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                <History className="text-[#FF7A00]" size={18} />
                Meus Rascunhos Salvos
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {savedDrafts.map(draft => (
                  <div key={draft.id} className="min-w-[260px] p-3 bg-[#0e0e11] border border-[#242429] hover:border-[#FF7A00]/50 rounded-xl flex flex-col gap-2 shrink-0 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{draft.clientName}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">#{draft.quoteNumber}</span>
                      </div>
                      <span className="text-xs font-bold text-[#FF7A00] font-mono">R$ {formatCurrency(draft.total)}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {draft.items?.length || 0} itens • {draft.savedAt}
                    </div>
                    <div className="flex items-center gap-2 mt-1 border-t border-[#242429] pt-2">
                      <button onClick={() => handleRestoreDraft(draft)} className="flex-1 bg-[#18181c] hover:bg-[#242429] text-zinc-300 text-[10px] font-bold py-1.5 rounded transition-colors">
                        Resgatar
                      </button>
                      <button onClick={(e) => handleDeleteDraft(e, draft.id)} className="px-2 text-zinc-500 hover:text-red-400 hover:bg-[#242429] py-1.5 rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
          <section className="bg-surface-container rounded border border-outline-variant p-5">
            <h2 className="text-sm font-bold text-on-surface mb-2.5 flex items-center gap-2">
              <AlignLeft className="text-primary" size={18} />
              Observações & Condições de Pagamento
            </h2>
            <textarea 
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant leading-relaxed" 
              placeholder="Validade do orçamento, prazos, formas de pagamento..."
            />
          </section>
        </div>

        {/* Live Preview (Right Column) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
          <div className="bg-surface-container rounded border border-outline-variant overflow-hidden flex flex-col shadow-2xl shadow-black/60">
            {/* Preview Header */}
            <div className="bg-surface-container-highest p-3.5 border-b border-outline-variant flex justify-between items-center shrink-0">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={16} className="text-[#FF7A00]" />
                Prévia Oficial A4
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  title="Imprimir tela"
                  className="p-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <Printer size={15} />
                </button>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-primary/20">
                  A4 Timbrado
                </span>
              </div>
            </div>
            
            {/* "Paper" Area */}
            <div className="p-5 bg-white text-gray-900 m-3 rounded-lg shadow-inner border border-gray-300 text-[11px] leading-tight select-none">
              
              {/* Header Box */}
              <div className="flex items-center justify-between border-b-2 border-gray-900 pb-3 mb-3">
                <div>
                  <h1 className="text-base font-black uppercase text-gray-900 tracking-tight">JC Eletricista</h1>
                  <p className="text-[9px] text-[#ea580c] font-bold">Serviços Elétricos Profissionais</p>
                  <p className="text-[8px] text-gray-500">Residencial • Comercial • Padrão</p>
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

              {/* Export CTA */}
              <button
                type="button"
                onClick={handleGeneratePdf}
                className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white py-2 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                <FileDown size={14} />
                Baixar PDF Oficial
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: RESTAURAR RASCUNHO */}
      {isDraftsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141418] border border-[#292930] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-5 border-b border-[#242429]">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <History size={18} className="text-[#FF7A00]" />
                <span>Rascunhos Salvos ({savedDrafts.length})</span>
              </div>
              <button
                onClick={() => setIsDraftsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {savedDrafts.length > 0 ? (
                savedDrafts.map(draft => (
                  <div 
                    key={draft.id} 
                    onClick={() => handleRestoreDraft(draft)}
                    className="p-4 bg-[#0e0e11] hover:bg-[#18181f] border border-[#242429] hover:border-[#FF7A00]/40 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{draft.clientName}</h4>
                        <span className="text-[10px] font-mono text-zinc-500">#{draft.quoteNumber}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        {draft.items?.length || 0} itens • {draft.items?.map(i => i.description).join(', ')}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1">Salvo em {draft.savedAt}</p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <span className="text-xs font-bold text-[#FF7A00] font-mono">
                          R$ {formatCurrency(draft.total)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteDraft(e, draft.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-[#25252e] rounded-lg transition-colors"
                        title="Excluir Rascunho"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  Nenhum rascunho salvo ainda. Preencha os dados e clique em &quot;Salvar Rascunho&quot;.
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
    </>
  );
}

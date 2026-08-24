'use client';

import { useState, useEffect } from 'react';
import { Save, FileDown, User, Wrench, Trash2, PlusCircle, AlignLeft, Eye, Cloud } from 'lucide-react';
import Image from 'next/image';
import type { Client } from '../clientes/page';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';

const LOGO_URL = '/logo.jpg';

type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

type DraftQuote = {
  id: string;
  clientName: string;
  total: number;
  date: string;
  itemsStr: string;
}

export default function OrcamentosPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [address, setAddress] = useState('');
  
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unitPrice: 0 });
  const [discount, setDiscount] = useState(0);

  const { token, spreadsheetId, syncDataToSheets } = useGoogleSheets();
  const [drafts, setDrafts] = useState<DraftQuote[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('@jc-eletricista:clients');
    const savedDrafts = localStorage.getItem('@jc-eletricista:drafts');
    if (saved) {
      try {
        const timeoutId = setTimeout(() => {
          setClients(JSON.parse(saved));
          if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
        }, 0);
        return () => clearTimeout(timeoutId);
      } catch (e) {}
    }
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
    if (newItem.description && newItem.quantity > 0) {
      setItems([...items, { ...newItem, id: Date.now().toString() }]);
      setNewItem({ description: '', quantity: 1, unitPrice: 0 });
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const total = subtotal - discount;

  const handleSaveDraft = async () => {
    if (!selectedClient || items.length === 0) {
      alert('Selecione um cliente e adicione itens antes de salvar.');
      return;
    }

    setIsSyncing(true);
    
    const newDraft: DraftQuote = {
      id: Date.now().toString(),
      clientName: selectedClient,
      total,
      date: new Date().toLocaleDateString('pt-BR'),
      itemsStr: items.map(i => `${i.quantity}x ${i.description}`).join(', ')
    };
    
    const newDrafts = [newDraft, ...drafts];
    setDrafts(newDrafts);
    localStorage.setItem('@jc-eletricista:drafts', JSON.stringify(newDrafts));

    if (token && spreadsheetId) {
      const sheetData = [
        ['ID', 'Cliente', 'Data', 'Itens', 'Total'],
        ...newDrafts.map(d => [d.id, d.clientName, d.date, d.itemsStr, d.total.toString()])
      ];
      await syncDataToSheets('Orcamentos', sheetData);
    }
    
    setIsSyncing(false);
    alert('Orçamento salvo com sucesso!');
  };

  return (
    <>
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Novo Orçamento</h1>
          <p className="text-sm text-on-surface-variant mt-1">Preencha os dados do serviço para gerar o documento.</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button 
            onClick={handleSaveDraft}
            disabled={isSyncing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-primary text-primary px-4 py-2 rounded text-[11px] font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {isSyncing ? <Cloud size={18} className="animate-pulse" /> : <Save size={18} />}
            {isSyncing ? 'Sincronizando...' : 'Salvar Rascunho'}
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-2 rounded text-[11px] font-bold uppercase tracking-wider hover:bg-primary-container transition-colors shadow-lg shadow-primary/20">
            <FileDown size={18} />
            Gerar PDF
          </button>
        </div>
      </header>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Form Editor (Left Column) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* Client Details Card */}
          <section className="bg-surface-container rounded border border-outline-variant p-6">
            <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <User className="text-primary" size={20} />
              Dados do Cliente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Cliente / Empresa</label>
                <select 
                  className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-on-surface focus:outline-none focus:border-primary appearance-none"
                  value={selectedClient}
                  onChange={handleClientChange}
                >
                  <option disabled value="">Selecione um cliente cadastrado...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Local da Obra / Serviço</label>
                <input 
                  type="text" 
                  className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                  placeholder="Rua, Número, Bairro" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Service Items Card */}
          <section className="bg-surface-container rounded border border-outline-variant p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-2">
              <Wrench className="text-primary" size={20} />
              Itens do Serviço
            </h2>
            
            <div className="bg-background rounded border border-outline-variant overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-surface-container-highest border-b border-outline-variant text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                    <th className="p-3 w-1/2">Descrição do Serviço / Material</th>
                    <th className="p-3 w-24">Qtd</th>
                    <th className="p-3 w-32">V. Unitário (R$)</th>
                    <th className="p-3 w-32">Total (R$)</th>
                    <th className="p-3 w-10 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-outline-variant/50 hover:bg-surface-container-high transition-colors group">
                      <td className="p-3 text-sm text-on-surface">{item.description}</td>
                      <td className="p-3 text-sm text-on-surface">{item.quantity}</td>
                      <td className="p-3 text-sm text-on-surface text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-3 text-sm text-on-surface text-right">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleRemoveItem(item.id)} className="text-on-surface-variant hover:text-error opacity-50 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* New Item Input Row */}
                  <tr>
                    <td className="p-2">
                      <input 
                        type="text" 
                        placeholder="Adicionar novo item..." 
                        className="w-full bg-surface-container-highest border border-outline-variant focus:border-primary rounded px-3 py-2 text-on-surface text-sm outline-none"
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        min="1"
                        className="w-full bg-surface-container-highest border border-outline-variant focus:border-primary rounded px-3 py-2 text-on-surface text-sm outline-none"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value) || 1})}
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-full bg-surface-container-highest border border-outline-variant focus:border-primary rounded px-3 py-2 text-on-surface text-sm outline-none text-right"
                        value={newItem.unitPrice}
                        onChange={(e) => setNewItem({...newItem, unitPrice: Number(e.target.value) || 0})}
                      />
                    </td>
                    <td className="p-2 text-right text-sm text-on-surface-variant px-3 py-2">
                      {formatCurrency(newItem.quantity * newItem.unitPrice)}
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={handleAddItem} disabled={!newItem.description} className="text-primary hover:text-primary-container transition-colors disabled:opacity-50">
                        <PlusCircle size={24} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <div className="w-64">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Subtotal</span>
                  <span className="text-sm text-on-surface">R$ {formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Desconto</span>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-24 bg-surface-container-highest border border-outline-variant focus:border-primary rounded px-2 py-1 text-on-surface text-sm outline-none text-right" 
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="flex justify-between items-center py-4 mt-2">
                  <span className="text-lg font-bold text-on-surface">Total</span>
                  <span className="text-xl font-bold text-primary">R$ {formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Observations */}
          <section className="bg-surface-container rounded border border-outline-variant p-6">
            <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <AlignLeft className="text-primary" size={20} />
              Observações
            </h2>
            <textarea 
              className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-on-surface h-24 resize-none focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant" 
              placeholder="Validade do orçamento, prazos de pagamento, exclusões..."
            ></textarea>
          </section>
        </div>

        {/* Live PDF Preview (Right Column) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
          <div className="bg-surface-container rounded border border-outline-variant overflow-hidden flex flex-col h-[calc(100vh-120px)] shadow-xl shadow-black/50">
            {/* Preview Header */}
            <div className="bg-surface-container-highest p-4 border-b border-outline-variant flex justify-between items-center shrink-0">
              <h3 className="text-[11px] font-semibold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <Eye size={18} />
                Prévia do Documento
              </h3>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-bold uppercase border border-primary/20 tracking-wider">A4 Vertical</span>
            </div>
            
            {/* "Paper" Area */}
            <div className="flex-1 bg-[#f8f9fa] p-6 overflow-y-auto m-4 rounded shadow-inner text-gray-900 border border-gray-300 select-none">
              
              <div className="flex items-center justify-between border-b-2 border-gray-900 pb-4 mb-4">
                <div className="w-32 h-16 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                  <Image src={LOGO_URL} alt="Logo" fill className="object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                </div>
                <div className="text-right">
                  <h1 className="text-xl font-black uppercase text-gray-900 tracking-tighter">Orçamento</h1>
                  <p className="text-xs text-gray-600">Nº 2024-0001</p>
                  <p className="text-xs text-gray-600">Data: Hoje</p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-[10px] font-bold uppercase text-gray-500 mb-1">Para</h2>
                <p className="text-sm font-bold text-gray-800">{selectedClient || 'Nome do Cliente'}</p>
                <p className="text-xs text-gray-600">{address || 'Endereço da Obra'}</p>
              </div>

              <table className="w-full text-xs text-left mb-6">
                <thead className="border-b border-gray-300">
                  <tr className="text-gray-500 uppercase">
                    <th className="py-2 w-3/5">Descrição</th>
                    <th className="py-2 w-1/5 text-right">Qtd</th>
                    <th className="py-2 w-1/5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {items.length > 0 ? items.map(item => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="py-4 text-center text-gray-400 italic">Nenhum item adicionado.</td></tr>
                  )}
                </tbody>
              </table>

              <div className="flex justify-end border-t-2 border-gray-900 pt-4 mt-auto">
                <div className="w-1/2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Desconto</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold mt-2">
                    <span className="text-gray-800">Total R$</span>
                    <span className="text-[#f97316]">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </>
  );
}

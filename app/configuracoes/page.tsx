'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Cloud, 
  CheckCircle, 
  ExternalLink, 
  HelpCircle, 
  RefreshCw, 
  FileSpreadsheet, 
  PlusCircle, 
  AlertCircle, 
  LogOut, 
  Wrench, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  RotateCcw,
  Check
} from 'lucide-react';
import { useGoogleSheets, CatalogItem, DEFAULT_CATALOG_ITEMS } from '@/hooks/useGoogleSheets';

export default function ConfiguracoesPage() {
  const { 
    login, 
    logout, 
    token, 
    user, 
    spreadsheetId, 
    isCreatingSpreadsheet, 
    lastError, 
    syncAllData, 
    createSpreadsheet,
    syncDataToSheets
  } = useGoogleSheets();

  const [activeTab, setActiveTab] = useState<'integracao' | 'itens'>('itens');
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(DEFAULT_CATALOG_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  
  // Modal de Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Instalação',
    unitPrice: '',
    unit: 'un',
    description: ''
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Carregar catálogo de itens do LocalStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('@jc-eletricista:catalog_items');
      if (saved) {
        try {
          setCatalogItems(JSON.parse(saved));
        } catch {
          setCatalogItems(DEFAULT_CATALOG_ITEMS);
        }
      } else {
        localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify(DEFAULT_CATALOG_ITEMS));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const saveCatalogItems = async (items: CatalogItem[]) => {
    setCatalogItems(items);
    localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify(items));
    
    // Se conectado, sincroniza a aba Catalogo_Itens na Planilha Google
    if (token && spreadsheetId) {
      const catalogRows = [
        ['ID', 'Nome / Descrição do Item', 'Categoria', 'Unidade', 'Preço Padrão (R$)', 'Observação', 'Data de Cadastro'],
        ...items.map(c => [
          c.id, c.name, c.category, c.unit, c.unitPrice.toString(), c.description || '', c.createdAt || ''
        ])
      ];
      await syncDataToSheets('Catalogo_Itens', catalogRows);
    }
  };

  const handleOpenModal = (item?: CatalogItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        category: item.category,
        unitPrice: item.unitPrice.toString(),
        unit: item.unit,
        description: item.description || ''
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        category: 'Instalação',
        unitPrice: '',
        unit: 'un',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      alert('Informe o nome do item ou serviço.');
      return;
    }

    const priceNum = parseFloat(itemForm.unitPrice.replace(',', '.')) || 0;

    let updatedList: CatalogItem[];
    if (editingItem) {
      updatedList = catalogItems.map(i => 
        i.id === editingItem.id 
          ? { ...i, name: itemForm.name, category: itemForm.category, unitPrice: priceNum, unit: itemForm.unit, description: itemForm.description }
          : i
      );
    } else {
      const newItem: CatalogItem = {
        id: `ITM-${(catalogItems.length + 1).toString().padStart(3, '0')}`,
        name: itemForm.name,
        category: itemForm.category,
        unitPrice: priceNum,
        unit: itemForm.unit,
        description: itemForm.description,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      updatedList = [newItem, ...catalogItems];
    }

    await saveCatalogItems(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Deseja realmente remover este item do catálogo?')) {
      const updatedList = catalogItems.filter(i => i.id !== id);
      await saveCatalogItems(updatedList);
    }
  };

  const handleResetDefaultCatalog = async () => {
    if (confirm('Restaurar os itens padrão do catálogo de eletricista?')) {
      await saveCatalogItems(DEFAULT_CATALOG_ITEMS);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const ok = await syncAllData();
      if (ok) {
        setSyncStatusMsg('Todos os clientes, orçamentos e itens foram sincronizados com sucesso na sua Planilha Google!');
      } else {
        setSyncStatusMsg('Faça login primeiro para sincronizar.');
      }
    } catch (err: any) {
      setSyncStatusMsg('Erro ao sincronizar: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateNewSpreadsheet = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const id = await createSpreadsheet();
      if (id) {
        setSyncStatusMsg('Planilha criada com sucesso no seu Google Drive com as abas Clientes, Orcamentos, Itens e Catalogo_Itens!');
      } else {
        setSyncStatusMsg('Não foi possível criar a planilha. Verifique a conexão com o Google.');
      }
    } catch (err: any) {
      setSyncStatusMsg('Erro: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const categories = ['Todas', 'Instalação', 'Manutenção', 'Material', 'Padrão de Entrada', 'Outro'];

  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222226]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#141418] border border-[#27272a] rounded-xl text-[#FF7A00]">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Configurações & Catálogo</h1>
            <p className="text-xs text-zinc-400">Cadastre serviços, tabela de preços e gerencie a integração com Google Sheets.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#141418] p-1 rounded-xl border border-[#26262b] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('itens')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'itens' 
                ? 'bg-[#FF7A00] text-black shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Wrench size={14} />
            Cadastrar Itens ({catalogItems.length})
          </button>
          <button
            onClick={() => setActiveTab('integracao')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'integracao' 
                ? 'bg-[#FF7A00] text-black shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cloud size={14} />
            Google Sheets & Nuvem
          </button>
        </div>
      </div>

      {/* TAB 1: CADASTRO DE ITENS / TABELA DE PREÇOS */}
      {activeTab === 'itens' && (
        <div className="space-y-5">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[#0e0e11] border border-[#222226] p-4 rounded-2xl">
            <div className="flex flex-1 items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar item ou serviço por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141418] border border-[#28282e] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#141418] border border-[#28282e] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-[#FF7A00]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetDefaultCatalog}
                title="Restaurar tabela padrão de serviços"
                className="bg-[#18181c] hover:bg-[#222228] border border-[#2a2a30] text-zinc-400 hover:text-white text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <RotateCcw size={14} />
                Padrão
              </button>

              <button
                onClick={() => handleOpenModal()}
                className="bg-[#FF7A00] hover:bg-[#FF8A00] text-black text-xs font-black px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#FF7A00]/20"
              >
                <Plus size={16} />
                Novo Item / Serviço
              </button>
            </div>
          </div>

          {/* Items List Table */}
          <div className="bg-[#0e0e11] border border-[#222226] rounded-2xl overflow-hidden shadow-xl shadow-black/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-[#141418] border-b border-[#242429] text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3.5 w-20">ID</th>
                    <th className="p-3.5">Nome / Descrição do Serviço</th>
                    <th className="p-3.5 w-28">Categoria</th>
                    <th className="p-3.5 w-20 text-center">Unidade</th>
                    <th className="p-3.5 w-32 text-right">Preço Padrão</th>
                    <th className="p-3.5 w-24 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e24] text-xs text-zinc-200">
                  {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-[#141418]/60 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] text-zinc-500 font-bold">{item.id}</td>
                        <td className="p-3.5">
                          <p className="font-semibold text-white">{item.name}</p>
                          {item.description && (
                            <p className="text-[11px] text-zinc-400 mt-0.5">{item.description}</p>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-[#1e1e26] border border-[#2d2d38] text-zinc-300 text-[10px] font-semibold rounded-md">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-center text-zinc-400 font-mono">{item.unit}</td>
                        <td className="p-3.5 text-right font-bold text-[#FF7A00]">
                          R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenModal(item)}
                              className="p-1.5 text-zinc-400 hover:text-[#FF7A00] hover:bg-[#1f1f26] rounded-lg transition-colors"
                              title="Editar Item"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-[#1f1f26] rounded-lg transition-colors"
                              title="Excluir Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500 italic">
                        Nenhum item encontrado. Clique em &quot;Novo Item / Serviço&quot; para cadastrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE SHEETS & NUVEM */}
      {activeTab === 'integracao' && (
        <div className="space-y-6">
          <div className="bg-[#0e0e11] border border-[#222226] rounded-2xl p-6 shadow-xl shadow-black/50 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#18181c] border border-[#2d2d32] rounded-xl text-[#FF7A00]">
                  <Cloud size={28} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Google Sheets & Google Drive</h2>
                  <p className="text-xs text-zinc-400">
                    {token ? `Conectado como ${user?.email || 'Usuário Google'}` : 'Conecte sua conta Google para salvar tudo em tempo real.'}
                  </p>
                </div>
              </div>
              {token ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                    <CheckCircle size={14} /> Conectado
                  </span>
                  <button 
                    onClick={logout}
                    title="Desconectar"
                    className="p-1.5 text-zinc-400 hover:text-red-400 bg-[#18181c] hover:bg-[#222228] border border-[#2d2d34] rounded-lg transition-colors"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs font-bold rounded-full w-fit">
                  Desconectado
                </span>
              )}
            </div>

            {lastError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-red-400 text-xs">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Atenção ao conectar:</p>
                  <p className="mt-0.5 text-red-300">{lastError}</p>
                </div>
              </div>
            )}

            {token ? (
              <div className="bg-[#141418] border border-emerald-500/30 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Planilha: JC Eletricista - Base de Dados</h3>
                      <p className="text-xs text-zinc-400">
                        {spreadsheetId ? `ID: ${spreadsheetId}` : 'Nenhuma planilha vinculada ainda.'}
                      </p>
                    </div>
                  </div>

                  {spreadsheetId ? (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shrink-0 shadow-lg shadow-emerald-900/30"
                    >
                      <ExternalLink size={14} />
                      Abrir no Google Sheets
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateNewSpreadsheet}
                      disabled={isCreatingSpreadsheet || isSyncing}
                      className="bg-[#FF7A00] hover:bg-[#FF8A00] text-black text-xs font-black px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shrink-0 shadow-lg shadow-[#FF7A00]/20 disabled:opacity-50"
                    >
                      <PlusCircle size={16} />
                      {isCreatingSpreadsheet ? 'Criando Planilha...' : 'Criar Planilha Agora'}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-[#242429]">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing || isCreatingSpreadsheet}
                    className="bg-[#242429] hover:bg-[#2e2e36] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all border border-zinc-700 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin text-[#FF7A00]' : 'text-[#FF7A00]'} />
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Dados Agora'}
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNewSpreadsheet}
                    disabled={isSyncing || isCreatingSpreadsheet}
                    className="bg-[#242429] hover:bg-[#2e2e36] text-zinc-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all border border-zinc-800 disabled:opacity-50"
                  >
                    <PlusCircle size={14} />
                    Recriar / Nova Planilha
                  </button>
                </div>

                {syncStatusMsg && (
                  <p className="text-xs text-emerald-400 font-medium bg-emerald-500/10 p-2.5 rounded border border-emerald-500/20 flex items-center gap-2">
                    <Check size={14} />
                    {syncStatusMsg}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-[#141418] border border-[#242429] rounded-xl p-6 text-center space-y-4">
                <p className="text-xs text-zinc-300 max-w-md mx-auto">
                  Clique no botão abaixo para autorizar o acesso da sua conta Google e criar automaticamente a planilha <strong>JC Eletricista - Base de Dados</strong> no seu Google Drive.
                </p>
                <button
                  type="button"
                  onClick={login}
                  className="inline-flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-800 px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all hover:scale-[1.01]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Conectar com o Google
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#0e0e11] border border-[#222226] rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#FF7A00] text-xs font-bold uppercase tracking-wider">
              <HelpCircle size={16} />
              <span>Abas Sincronizadas no Google Sheets</span>
            </div>
            <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
              <p>A planilha <strong>&quot;JC Eletricista - Base de Dados&quot;</strong> armazena quatro abas dedicadas:</p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
                <li><strong className="text-zinc-200">Clientes:</strong> Cadastro completo com telefone, endereço e documento.</li>
                <li><strong className="text-zinc-200">Orcamentos:</strong> Histórico de todos os orçamentos emitidos com totais.</li>
                <li><strong className="text-zinc-200">Itens:</strong> Cada serviço ou material adicionado a qualquer orçamento (com ID individual, quantidade e preço).</li>
                <li><strong className="text-zinc-200">Catalogo_Itens:</strong> Tabela de preços padrão de serviços e materiais.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR / EDITAR ITEM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141418] border border-[#292930] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-5 border-b border-[#242429]">
              <div className="flex items-center gap-2 text-white font-bold">
                <Wrench size={18} className="text-[#FF7A00]" />
                <span>{editingItem ? 'Editar Item do Catálogo' : 'Novo Item / Serviço'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nome / Descrição do Serviço ou Material *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Instalação de Tomada 20A"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full bg-[#0a0a0c] border border-[#2c2c31] text-xs text-white rounded-lg p-3 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Categoria</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full bg-[#0a0a0c] border border-[#2c2c31] text-xs text-white rounded-lg p-3 focus:outline-none focus:border-[#FF7A00]"
                  >
                    <option value="Instalação">Instalação</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Material">Material</option>
                    <option value="Padrão de Entrada">Padrão de Entrada</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Unidade</label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full bg-[#0a0a0c] border border-[#2c2c31] text-xs text-white rounded-lg p-3 focus:outline-none focus:border-[#FF7A00]"
                  >
                    <option value="un">un (Unidade)</option>
                    <option value="ponto">ponto</option>
                    <option value="m">m (Metro)</option>
                    <option value="serviço">serviço</option>
                    <option value="hora">hora</option>
                    <option value="diária">diária</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Preço Padrão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={itemForm.unitPrice}
                    onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })}
                    className="w-full bg-[#0a0a0c] border border-[#2c2c31] text-xs text-white rounded-lg p-3 focus:outline-none focus:border-[#FF7A00] font-mono text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Detalhes / Observações (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Não inclui alvenaria ou pintura"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full bg-[#0a0a0c] border border-[#2c2c31] text-xs text-white rounded-lg p-3 focus:outline-none focus:border-[#FF7A00] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#242429]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-[#1a1a20] rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-black bg-[#FF7A00] hover:bg-[#FF8A00] rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-[#FF7A00]/20"
                >
                  <Save size={14} />
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

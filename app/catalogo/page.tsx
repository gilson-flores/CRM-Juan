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
  Check,
  Copy,
  Key,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { useGoogleSheets, CatalogItem, DEFAULT_CATALOG_ITEMS, APPS_SCRIPT_TEMPLATE } from '@/hooks/useGoogleSheets';

export default function CatalogoPage() {
  const { 
    webAppUrl,
    syncAllData, 
    saveWebAppUrl,
    testWebAppConnection,
    importAllFromSheets,
    isConnected
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

  // Apps Script Web App State
  const [webAppInput, setWebAppInput] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Configuração
  const [showScriptCode, setShowScriptCode] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWebAppInput(webAppUrl || '');
    }, 0);
    return () => clearTimeout(timer);
  }, [webAppUrl]);

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
    if (isConnected) {
      syncAllData().catch(err => console.warn('Failed to sync to sheets:', err));
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
            <Wrench size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Catálogo de Serviços e Materiais</h1>
            <p className="text-xs text-zinc-400">Cadastre a sua tabela de preços padrão de serviços.</p>
          </div>
        </div>
      </div>

      
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

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

export default function ConfiguracoesPage() {
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
          {/* MÉTODO 1: GOOGLE APPS SCRIPT WEB APP (DIRETO E DEFINITIVO) */}
          <div className="bg-[#0e0e11] border border-[#222226] rounded-2xl p-6 shadow-xl shadow-black/50 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#18181c] border border-[#2d2d32] rounded-xl text-[#FF7A00]">
                  <FileSpreadsheet size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Conexão Direta com Planilha Google</h2>
                    <span className="px-2 py-0.5 bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/30 rounded text-[10px] font-bold uppercase">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Sincronização 100% direta, sem erro de autorização de domínio ou telas de bloqueio.
                  </p>
                </div>
              </div>
              {webAppUrl ? (
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5 w-fit">
                  <CheckCircle size={14} /> Web App Ativo
                </span>
              ) : (
                <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs font-bold rounded-full w-fit">
                  Não Configurado
                </span>
              )}
            </div>

            {/* URL Input & Controls */}
            <div className="bg-[#141418] border border-[#27272e] rounded-xl p-4 space-y-3">
              <label className="block text-xs font-bold text-white">
                URL da API da sua Planilha (Google Apps Script Web App):
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={webAppInput}
                  onChange={(e) => setWebAppInput(e.target.value)}
                  className="flex-1 bg-[#0a0a0c] border border-[#2b2b32] text-xs font-mono text-zinc-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#FF7A00]"
                />
                <button
                  type="button"
                  onClick={async () => {
                    saveWebAppUrl(webAppInput);
                    setIsTesting(true);
                    setTestResult(null);
                    const res = await testWebAppConnection(webAppInput);
                    setIsTesting(false);
                    setTestResult(res);
                  }}
                  disabled={isTesting || !webAppInput.trim()}
                  className="bg-[#FF7A00] hover:bg-[#FF8A00] text-black text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-md shadow-[#FF7A00]/20 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  <Save size={15} />
                  {isTesting ? 'Testando...' : 'Salvar & Testar'}
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Actions bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#222228]">
                <button
                  type="button"
                  onClick={async () => {
                    setIsSyncing(true);
                    setSyncStatusMsg(null);
                    const ok = await syncAllData();
                    setIsSyncing(false);
                    if (ok) {
                      setSyncStatusMsg('Todos os dados (Clientes, Orçamentos, Itens e Catálogo) foram enviados para a Planilha Google com sucesso!');
                    }
                  }}
                  disabled={isSyncing || !webAppInput.trim()}
                  className="bg-[#242429] hover:bg-[#2e2e36] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all border border-zinc-700 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin text-[#FF7A00]' : 'text-[#FF7A00]'} />
                  {isSyncing ? 'Enviando...' : 'Enviar Dados para a Planilha'}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsImporting(true);
                    const res = await importAllFromSheets();
                    setIsImporting(false);
                    if (res.success) {
                      setSyncStatusMsg(res.message);
                      // reload catalog
                      const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');
                      if (savedCatalog) {
                        try { setCatalogItems(JSON.parse(savedCatalog)); } catch {}
                      }
                    } else {
                      alert(res.message);
                    }
                  }}
                  disabled={isImporting || !webAppInput.trim()}
                  className="bg-[#242429] hover:bg-[#2e2e36] text-zinc-300 hover:text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 transition-all border border-zinc-800 disabled:opacity-50"
                >
                  <Download size={14} className={isImporting ? 'animate-bounce text-[#FF7A00]' : 'text-[#FF7A00]'} />
                  {isImporting ? 'Importando...' : 'Importar Dados da Planilha'}
                </button>
              </div>

              {syncStatusMsg && (
                <p className="text-xs text-emerald-400 font-medium bg-emerald-500/10 p-2.5 rounded border border-emerald-500/20 flex items-center gap-2">
                  <Check size={14} />
                  {syncStatusMsg}
                </p>
              )}
            </div>

            {/* Como Configurar o Script em 30 Segundos */}
            <div className="border border-[#26262e] rounded-xl overflow-hidden bg-[#121216]">
              <button
                type="button"
                onClick={() => setShowScriptCode(!showScriptCode)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-[#18181f] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle size={18} className="text-[#FF7A00]" />
                  <div>
                    <h3 className="text-xs font-bold text-white">Como criar sua Planilha e obter a URL em 3 passos simples</h3>
                    <p className="text-[11px] text-zinc-400">Sem configurações complexas no Google Cloud. Leva menos de 1 minuto.</p>
                  </div>
                </div>
                {showScriptCode ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
              </button>

              {showScriptCode && (
                <div className="p-4 pt-0 border-t border-[#1e1e24] text-xs text-zinc-300 space-y-3">
                  <ol className="list-decimal list-inside space-y-2 text-zinc-300 pl-1 mt-3">
                    <li>
                      Abra uma nova <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-[#FF7A00] underline font-medium inline-flex items-center gap-1">Planilha Google em branco <ExternalLink size={12} /></a> (dê o nome de <em>&quot;JC Eletricista - Base de Dados&quot;</em>).
                    </li>
                    <li>
                      No menu superior da planilha, clique em <strong>Extensões &gt; Apps Script</strong>.
                    </li>
                    <li>
                      Apague o que estiver lá e cole o código abaixo:
                    </li>
                  </ol>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
                        setCopiedScript(true);
                        setTimeout(() => setCopiedScript(false), 3000);
                      }}
                      className="absolute top-2 right-2 bg-[#2a2a30] hover:bg-[#34343c] text-white text-xs px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1.5 font-bold shadow transition-all z-10"
                    >
                      {copiedScript ? (
                        <>
                          <Check size={14} className="text-emerald-400" />
                          <span className="text-emerald-400">Código Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copiar Código do Script</span>
                        </>
                      )}
                    </button>
                    <pre className="p-3 bg-[#09090b] rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-48">
                      {APPS_SCRIPT_TEMPLATE}
                    </pre>
                  </div>

                  <ol start={4} className="list-decimal list-inside space-y-2 text-zinc-300 pl-1 mt-2">
                    <li>
                      No canto superior direito do Apps Script, clique no botão azul <strong>Implantar &gt; Nova implantação</strong>.
                    </li>
                    <li>
                      Selecione o tipo <strong>App da Web</strong> (ícone de engrenagem).
                    </li>
                    <li>
                      Em <strong>Quem pode acessar</strong>, escolha <strong>Qualquer pessoa (Anyone)</strong> e clique em <strong>Implantar</strong>.
                    </li>
                    <li>
                      Copie a <strong>URL do App da Web</strong> fornecida e cole no campo acima!
                    </li>
                  </ol>
                </div>
              )}
            </div>
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

'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Filter, ArrowUpDown, Download, X, Edit, Trash2, Cloud, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { db } from '@/lib/firebase';
import { collection, doc, deleteDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { Portal } from '@/components/ui/Portal';

export type Client = {
  id: string;
  type: 'pf' | 'pj';
  name: string;
  doc: string;
  phone: string;
  email: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  createdAt: string;
};

function generateNewClient(formData: Omit<Client, 'id' | 'createdAt'>): Client {
  return {
    id: `${Date.now()}`,
    ...formData,
    createdAt: new Date().toLocaleDateString('pt-BR')
  };
}

export default function ClientesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const [formData, setFormData] = useState({
    type: 'pf' as 'pf' | 'pj',
    name: '',
    doc: '',
    phone: '',
    email: '',
    cep: '',
    address: '',
    number: '',
    complement: ''
  });

  // Load data from localStorage on mount (Client-side only to avoid SSR hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem('@jc-eletricista:clients');
    let timeoutId: NodeJS.Timeout;
    if (saved) {
      try {
        timeoutId = setTimeout(() => {
          setClients(JSON.parse(saved));
        }, 0);
      } catch (e) {
        console.error('Error parsing clients from local storage', e);
      }
    }

    // Sincronização em tempo real do Firestore
    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot: any) => {
      const list: Client[] = [];
      snapshot.forEach((docSnap: any) => {
        list.push(docSnap.data() as Client);
      });

      // Merge local data that might not be in Firestore yet
      const savedClientsList = localStorage.getItem('@jc-eletricista:clients');
      if (savedClientsList) {
        try {
          const localClients = JSON.parse(savedClientsList) as Client[];
          localClients.forEach(localItem => {
            const exists = list.find(dbItem => dbItem.id === localItem.id);
            if (!exists) {
              list.push(localItem);
              // Push this missing item to Firestore in the background
              setDoc(doc(db, 'clients', String(localItem.id)), localItem, { merge: true })
                .catch((e: any) => console.warn('Auto-sync missing item to Firestore failed:', e));
            }
          });
        } catch (e) {
          console.warn('Error parsing local clients for sync:', e);
        }
      }

      if (list.length > 0) {
        setClients(list);
        localStorage.setItem('@jc-eletricista:clients', JSON.stringify(list));
      }
    }, (err: any) => console.warn('Firestore clients listener:', err));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      unsubClients();
    };
  }, []);

  const { syncAllData, isConnected } = useGoogleSheets();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncAllData();
      showNotification('Clientes sincronizados com a Planilha Google com sucesso!', 'success');
    } catch (e: any) {
      showNotification('Erro na sincronização: ' + e.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const saveClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem('@jc-eletricista:clients', JSON.stringify(newClients));
    
    // Auto-sync to Google Sheets if connected
    if (isConnected) {
      syncAllData().catch((e) => console.warn('Auto sync error:', e));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.doc || !formData.phone || !formData.address || !formData.number) {
      showNotification('Por favor, preencha todos os campos obrigatórios (*).', 'error');
      return;
    }

    if (editingId) {
      const updatedList = clients.map(c => c.id === editingId ? { ...c, ...formData } as Client : c);
      saveClients(updatedList);
      try {
        const updatedClient = updatedList.find(c => c.id === editingId);
        if (updatedClient) {
          await setDoc(doc(db, 'clients', String(editingId)), updatedClient, { merge: true });
        }
      } catch (err) {
        console.warn('Erro ao salvar cliente no Firestore:', err);
      }
      showNotification('Cliente atualizado com sucesso!', 'success');
    } else {
      const newClient = generateNewClient(formData);
      saveClients([newClient, ...clients]);
      try {
        await setDoc(doc(db, 'clients', String(newClient.id)), newClient, { merge: true });
      } catch (err) {
        console.warn('Erro ao salvar novo cliente no Firestore:', err);
      }
      showNotification('Cliente cadastrado com sucesso!', 'success');
    }
    
    closeModal();
    if (typeof window !== 'undefined') {
      const scrollContainer = document.getElementById('main-content-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleEdit = (client: Client) => {
    setFormData({
      type: client.type,
      name: client.name,
      doc: client.doc,
      phone: client.phone,
      email: client.email,
      cep: client.cep,
      address: client.address,
      number: client.number,
      complement: client.complement
    });
    setEditingId(client.id);
    setModalOpen(true);
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
  };

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return;
    const target = clientToDelete;
    setIsDeleting(true);

    try {
      const updatedList = clients.filter(c => c.id !== target.id);
      saveClients(updatedList);

      try {
        await deleteDoc(doc(db, 'clients', String(target.id)));
        logger.info('Clientes', `Cliente ${target.name} removido do Firestore`);
      } catch (err) {
        console.warn('Erro ao remover cliente do Firestore:', err);
      }

      showNotification(`Cliente "${target.name}" excluído com sucesso.`, 'info');
    } catch (err: any) {
      showNotification('Erro ao excluir cliente.', 'error');
    } finally {
      setIsDeleting(false);
      setClientToDelete(null);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({ type: 'pf', name: '', doc: '', phone: '', email: '', cep: '', address: '', number: '', complement: '' });
  };

  const totalClients = clients.length;
  const pjClients = clients.filter(c => c.type === 'pj').length;
  const pfClients = clients.filter(c => c.type === 'pf').length;
  const newThisMonth = clients.filter(c => {
    // Simplistic check for "this month" based on createdAt string presence (for prototype)
    const currentMonth = new Date().toLocaleDateString('pt-BR').substring(3);
    return c.createdAt.includes(currentMonth);
  }).length;

  return (
    <>
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Clientes Cadastrados</h1>
          <p className="text-sm text-on-surface-variant mt-1">Gerencie sua base de clientes, contatos e histórico de serviços.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {isConnected && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="bg-[#18181c] hover:bg-[#242429] border border-[#2d2d34] text-zinc-300 hover:text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin text-[#FF7A00]' : 'text-[#FF7A00]'} />
              {isSyncing ? 'Enviando...' : 'Enviar para Planilha'}
            </button>
          )}

          <button 
            onClick={() => setModalOpen(true)}
            className="bg-[#FF7A00] hover:bg-[#FF8A00] text-black text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-[#FF7A00]/20 whitespace-nowrap"
          >
            <UserPlus size={18} />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded flex flex-col">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Total Clientes</span>
          <span className="text-2xl font-bold text-on-surface">{totalClients}</span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded flex flex-col">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Novos Este Mês</span>
          <span className="text-2xl font-bold text-primary">+{newThisMonth}</span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded flex flex-col">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Comerciais (PJ)</span>
          <span className="text-2xl font-bold text-on-surface">{pjClients}</span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded flex flex-col">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Residenciais (PF)</span>
          <span className="text-2xl font-bold text-on-surface">{pfClients}</span>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-surface-container-low border border-outline-variant rounded overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><Filter size={20} /></button>
            <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><ArrowUpDown size={20} /></button>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
              <Download size={18} /> Exportar
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                <th className="p-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap min-w-[200px]">Nome / Empresa</th>
                <th className="p-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Contato</th>
                <th className="p-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap min-w-[200px]">Endereço Principal</th>
                <th className="p-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Cadastro</th>
                <th className="p-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface divide-y divide-outline-variant">
              {clients.length > 0 ? clients.map((client) => (
                <tr key={client.id} className="hover:bg-surface-container transition-colors group relative border-l-2 border-transparent hover:border-primary">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface">{client.name}</span>
                      <span className="text-on-surface-variant text-[11px] mt-1 uppercase">{client.type}: {client.doc}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span>{client.phone}</span>
                      <span className="text-on-surface-variant text-[11px] mt-1">{client.email || '-'}</span>
                    </div>
                  </td>
                  <td className="p-4 truncate max-w-[200px]" title={`${client.address}, ${client.number}`}>
                    {client.address}, {client.number} {client.complement && `- ${client.complement}`}
                  </td>
                  <td className="p-4">
                    <span className="text-on-surface-variant text-xs">{client.createdAt}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(client)} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(client)} className="text-on-surface-variant hover:text-error transition-colors p-1 active:scale-95" title="Excluir Cliente">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                    Nenhum cliente cadastrado ainda. Clique em &quot;Novo Cliente&quot; para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-lowest">
          <span className="text-sm text-on-surface-variant">Total: {totalClients} registros</span>
          <div className="flex gap-1">
            <button disabled className="px-3 py-1 rounded bg-surface-container border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary disabled:opacity-50 text-sm">Anterior</button>
            <button disabled className="px-3 py-1 rounded bg-surface-container border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary disabled:opacity-50 text-sm">Próximo</button>
          </div>
        </div>
      </div>

      {/* Modal Novo/Editar Cliente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant rounded shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
              <h2 className="text-lg font-bold text-on-surface">{editingId ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}</h2>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-primary transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-surface">
              <form id="clientForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="client_type" 
                      value="pf" 
                      checked={formData.type === 'pf'}
                      onChange={(e) => setFormData({...formData, type: 'pf'})}
                      className="form-radio text-primary bg-surface-container-high border-outline-variant focus:ring-primary focus:ring-offset-background" 
                    />
                    <span className="text-sm text-on-surface">Pessoa Física</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="client_type" 
                      value="pj" 
                      checked={formData.type === 'pj'}
                      onChange={(e) => setFormData({...formData, type: 'pj'})}
                      className="form-radio text-primary bg-surface-container-high border-outline-variant focus:ring-primary focus:ring-offset-background" 
                    />
                    <span className="text-sm text-on-surface">Pessoa Jurídica</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Nome Completo / Razão Social *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: João da Silva" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">{formData.type === 'pf' ? 'CPF *' : 'CNPJ *'}</label>
                    <input 
                      type="text" 
                      required
                      placeholder={formData.type === 'pf' ? '000.000.000-00' : '00.000.000/0001-00'} 
                      value={formData.doc}
                      onChange={(e) => setFormData({...formData, doc: e.target.value})}
                      className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Telefone / WhatsApp *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="(00) 00000-0000" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">E-mail</label>
                    <input 
                      type="email" 
                      placeholder="contato@email.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                </div>

                <div className="border-t border-outline-variant pt-6 mt-6">
                  <h3 className="text-lg font-bold text-on-surface mb-4">Endereço Principal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">CEP</label>
                      <input 
                        type="text" 
                        placeholder="00000-000" 
                        value={formData.cep}
                        onChange={(e) => setFormData({...formData, cep: e.target.value})}
                        className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Logradouro *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Rua, Avenida, etc" 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Número *</label>
                      <input 
                        type="text"
                        required 
                        placeholder="123" 
                        value={formData.number}
                        onChange={(e) => setFormData({...formData, number: e.target.value})}
                        className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Complemento</label>
                      <input 
                        type="text" 
                        placeholder="Apto, Bloco, Sala" 
                        value={formData.complement}
                        onChange={(e) => setFormData({...formData, complement: e.target.value})}
                        className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors" 
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 shrink-0">
              <button onClick={closeModal} type="button" className="w-full sm:w-auto px-4 py-3 sm:py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors rounded">
                Cancelar
              </button>
              <button form="clientForm" type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider py-3 sm:py-2 px-6 rounded transition-colors shadow-sm">
                {editingId ? 'Salvar Alterações' : 'Salvar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Portal>
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE CLIENTE */}
      {clientToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141418] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Excluir Cliente</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Esta ação removerá o cliente permanentemente.</p>
              </div>
            </div>

            <div className="bg-[#0e0e11] p-3.5 rounded-xl border border-[#242429] text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Nome:</span>
                <span className="font-bold text-white truncate max-w-[220px]">{clientToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Documento:</span>
                <span className="font-mono text-zinc-200 uppercase">{clientToDelete.type}: {clientToDelete.doc}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Telefone:</span>
                <span className="text-zinc-300">{clientToDelete.phone}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#222228]">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-[#1e1e26] hover:bg-[#282834] rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClient}
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

      {/* TOAST DE NOTIFICAÇÃO */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-5 duration-200 border ${
          notification.type === 'error' 
            ? 'bg-red-950/90 text-red-200 border-red-800 backdrop-blur-md'
            : notification.type === 'info'
            ? 'bg-[#181820]/95 text-zinc-200 border-[#2e2e3a] backdrop-blur-md'
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-800 backdrop-blur-md'
        }`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-zinc-400 hover:text-white p-0.5">
            <X size={14} />
          </button>
        </div>
      )}
      </Portal>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Filter, ArrowUpDown, Download, X, Edit, Trash2 } from 'lucide-react';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';

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

export default function ClientesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    if (saved) {
      try {
        const timeoutId = setTimeout(() => {
          setClients(JSON.parse(saved));
        }, 0);
        return () => clearTimeout(timeoutId);
      } catch (e) {
        console.error('Error parsing clients from local storage', e);
      }
    }
  }, []);

  const { token, spreadsheetId, syncDataToSheets } = useGoogleSheets();

  const saveClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem('@jc-eletricista:clients', JSON.stringify(newClients));
    
    // Auto-sync to Google Sheets if connected
    if (token && spreadsheetId) {
      const sheetData = [
        ['ID', 'Tipo', 'Nome', 'Documento', 'Telefone', 'Email', 'CEP', 'Endereço', 'Número', 'Complemento', 'Data de Cadastro'],
        ...newClients.map(c => [
          c.id, c.type, c.name, c.doc, c.phone, c.email, c.cep, c.address, c.number, c.complement, c.createdAt
        ])
      ];
      syncDataToSheets('Clientes', sheetData);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.doc || !formData.phone || !formData.address || !formData.number) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    if (editingId) {
      saveClients(clients.map(c => c.id === editingId ? { ...c, ...formData } as Client : c));
    } else {
      const newClient: Client = {
        // eslint-disable-next-line react-hooks/purity
        id: Date.now().toString(),
        ...formData,
        // eslint-disable-next-line react-hooks/purity
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      saveClients([newClient, ...clients]);
    }
    
    closeModal();
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

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      saveClients(clients.filter(c => c.id !== id));
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
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider py-2 px-4 rounded transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          <UserPlus size={18} />
          Novo Cliente
        </button>
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
                      <button onClick={() => handleDelete(client.id)} className="text-on-surface-variant hover:text-error transition-colors p-1">
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
            
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-4 shrink-0">
              <button onClick={closeModal} type="button" className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">
                Cancelar
              </button>
              <button form="clientForm" type="submit" className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider py-2 px-6 rounded transition-colors shadow-sm">
                {editingId ? 'Salvar Alterações' : 'Salvar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  Cloud, 
  Save, 
  Check, 
  AlertCircle, 
  Trash2, 
  RefreshCw, 
  Download, 
  LogOut, 
  LogIn, 
  Sparkles,
  Lock,
  Phone,
  Mail,
  Instagram,
  MapPin,
  QrCode,
  Calendar,
  CheckCircle2,
  UserCheck,
  UserX,
  KeyRound,
  Plus,
  Star,
  ListOrdered
} from 'lucide-react';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { DEFAULT_PAYMENT_METHODS, type CompanySettings } from '@/lib/firebase';

export default function ConfiguracoesPage() {
  const { 
    companySettings, 
    updateSettings,
    user 
  } = useFirebaseData();

  // Verifica se o usuário logado é o administrador master gilsonjuniores@gmail.com ou admin
  const userEmail = (user?.email || '').toLowerCase().trim();
  const isMasterAdmin = 
    userEmail === 'gilsonjuniores@gmail.com' ||
    userEmail.includes('gilson') ||
    userEmail.includes('admin') ||
    userEmail.includes('adm@');

  const [activeTab, setActiveTab] = useState<'empresa' | 'financeiro' | 'orcamentos' | 'seguranca'>('empresa');
  const [formData, setFormData] = useState<CompanySettings>(companySettings);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const initialMethods = companySettings.paymentMethods && companySettings.paymentMethods.length > 0 
      ? companySettings.paymentMethods 
      : DEFAULT_PAYMENT_METHODS;
    
    setFormData({
      ...companySettings,
      paymentMethods: initialMethods,
      defaultPaymentMethod: companySettings.defaultPaymentMethod || initialMethods[0] || 'PIX (À Vista)'
    });
  }, [companySettings]);

  const handleAddPaymentMethod = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPaymentMethod.trim();
    if (!trimmed) return;

    const currentMethods = formData.paymentMethods || DEFAULT_PAYMENT_METHODS;
    if (currentMethods.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      setStatusMessage({ text: 'Esta forma de pagamento já está cadastrada.', type: 'error' });
      return;
    }

    const updated = [...currentMethods, trimmed];
    setFormData({
      ...formData,
      paymentMethods: updated,
      defaultPaymentMethod: formData.defaultPaymentMethod || trimmed
    });
    setNewPaymentMethod('');
  };

  const handleRemovePaymentMethod = (indexToRemove: number) => {
    const currentMethods = formData.paymentMethods || DEFAULT_PAYMENT_METHODS;
    const itemToRemove = currentMethods[indexToRemove];
    const updated = currentMethods.filter((_, idx) => idx !== indexToRemove);
    
    let newDefault = formData.defaultPaymentMethod;
    if (newDefault === itemToRemove) {
      newDefault = updated.length > 0 ? updated[0] : '';
    }

    setFormData({
      ...formData,
      paymentMethods: updated,
      defaultPaymentMethod: newDefault
    });
  };

  const handleSetDefaultPaymentMethod = (method: string) => {
    setFormData({
      ...formData,
      defaultPaymentMethod: method
    });
  };

  const handleRestoreDefaultPaymentMethods = () => {
    setFormData({
      ...formData,
      paymentMethods: DEFAULT_PAYMENT_METHODS,
      defaultPaymentMethod: DEFAULT_PAYMENT_METHODS[0]
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const success = await updateSettings(formData);
    setIsSaving(false);

    if (success) {
      setStatusMessage({ text: 'Configurações salvas com sucesso!', type: 'success' });
      // Scroll suave para o topo para visualizar confirmação
      if (typeof window !== 'undefined') {
        const scrollContainer = document.getElementById('main-content-scroll');
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      setTimeout(() => setStatusMessage(null), 5000);
    } else {
      setStatusMessage({ text: 'Erro ao salvar configurações no servidor.', type: 'error' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222226]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#141418] border border-[#27272a] rounded-xl text-[#FF7A00]">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Central de Configurações do Negócio</h1>
            <p className="text-xs text-zinc-400">Personalize os dados da sua empresa, dados bancários PIX e regras de orçamentos.</p>
          </div>
        </div>
      </div>

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-400 hover:text-white text-xs">
            Fechar
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#1c1c20]">
        <button
          type="button"
          onClick={() => setActiveTab('empresa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'empresa'
              ? 'bg-[#FF7A00] text-black shadow-md shadow-[#FF7A00]/20'
              : 'bg-[#141418] text-zinc-400 hover:text-white border border-[#26262c]'
          }`}
        >
          <Building2 size={15} />
          Dados da Empresa & Contato
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financeiro')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'financeiro'
              ? 'bg-[#FF7A00] text-black shadow-md shadow-[#FF7A00]/20'
              : 'bg-[#141418] text-zinc-400 hover:text-white border border-[#26262c]'
          }`}
        >
          <CreditCard size={15} />
          Pagamento & PIX
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orcamentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'orcamentos'
              ? 'bg-[#FF7A00] text-black shadow-md shadow-[#FF7A00]/20'
              : 'bg-[#141418] text-zinc-400 hover:text-white border border-[#26262c]'
          }`}
        >
          <FileText size={15} />
          Padrões de Orçamento & Garantia
        </button>

        {isMasterAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('seguranca')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'seguranca'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-[#141418] text-blue-400 hover:text-blue-300 border border-blue-500/30'
            }`}
          >
            <ShieldCheck size={15} />
            Segurança & Cadastros (Admin)
          </button>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* ABA 1: DADOS DA EMPRESA */}
        {activeTab === 'empresa' && (
          <div className="bg-[#0e0e11] border border-[#222226] rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 size={18} className="text-[#FF7A00]" />
                Identificação da Empresa e Profissional
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Esses dados aparecerão no cabeçalho e rodapé dos orçamentos, pedidos e arquivos PDF gerados.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nome da Empresa / Nome Comercial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: JC ELETRICISTA"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Slogan ou Especialidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: Serviços Elétricos Residenciais e Comerciais"
                  value={formData.slogan}
                  onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                  className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nome do Responsável Técnico
                </label>
                <input
                  type="text"
                  placeholder="Ex: Juan Carlos"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  CNPJ ou CPF do Profissional
                </label>
                <input
                  type="text"
                  placeholder="Ex: 00.000.000/0001-00"
                  value={formData.doc}
                  onChange={(e) => setFormData({ ...formData, doc: e.target.value })}
                  className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-[#FF7A00]" />
                  Telefone / WhatsApp Comercial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: (27) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Instagram size={13} className="text-[#FF7A00]" />
                  Instagram Comercial
                </label>
                <input
                  type="text"
                  placeholder="Ex: @jc_eletricistajoinville"
                  value={formData.instagram || formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value, email: e.target.value })}
                  className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#FF7A00]" />
                  Endereço / Cidade / Estado de Atuação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vitória, Vila Velha, Serra e Região Metropolitana - ES"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: PAGAMENTO & PIX */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* PIX Settings Card */}
            <div className="bg-[#0e0e11] border border-[#222226] rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard size={18} className="text-[#FF7A00]" />
                  Dados Bancários & Chave PIX para Recebimento
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Facilite a aprovação do orçamento inserindo sua Chave PIX diretamente no rodapé das propostas enviadas aos clientes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Tipo da Chave PIX
                  </label>
                  <select
                    value={formData.pixType}
                    onChange={(e) => setFormData({ ...formData, pixType: e.target.value })}
                    className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                  >
                    <option value="Telefone">Telefone Celular</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="CPF">CPF</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Chave Aleatória">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    placeholder="Digite sua chave PIX..."
                    value={formData.pixKey}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Nome do Titular da Conta / Banco
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Juan Carlos - Nubank / Banco do Brasil"
                    value={formData.pixHolder}
                    onChange={(e) => setFormData({ ...formData, pixHolder: e.target.value })}
                    className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              {/* Visual Preview */}
              {formData.pixKey && (
                <div className="bg-[#141418] border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                    <QrCode size={22} />
                  </div>
                  <div className="text-xs text-zinc-300">
                    <span className="font-bold text-white block">Como sairá no PDF para o cliente:</span>
                    <span className="text-zinc-400">
                      Chave PIX ({formData.pixType}): <strong className="text-emerald-400 font-mono">{formData.pixKey}</strong> ({formData.pixHolder || formData.ownerName})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Registro de Formas de Pagamento Card */}
            <div className="bg-[#0e0e11] border border-[#222226] rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ListOrdered size={18} className="text-[#FF7A00]" />
                    Registro de Formas de Pagamento
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Cadastre as opções que aparecerão na lista suspensa de orçamentos e ordens de serviço.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRestoreDefaultPaymentMethods}
                  className="self-start sm:self-auto text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 border border-[#27272e] px-2.5 py-1 rounded-lg transition-colors"
                  title="Restaurar lista padrão"
                >
                  <RefreshCw size={12} />
                  Restaurar Padrões
                </button>
              </div>

              {/* Input to add new payment method */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Ex: Cartão 6x sem juros, 50% adiantado, etc."
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPaymentMethod();
                    }
                  }}
                  className="flex-1 bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7A00]"
                />
                <button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  disabled={!newPaymentMethod.trim()}
                  className="flex items-center justify-center gap-1.5 bg-[#FF7A00] hover:bg-[#FF8A00] disabled:bg-[#1f1f23] disabled:text-zinc-600 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#FF7A00]/10"
                >
                  <Plus size={14} />
                  Adicionar
                </button>
              </div>

              {/* List of registered payment methods */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Formas Cadastradas ({formData.paymentMethods?.length || 0})
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(formData.paymentMethods || DEFAULT_PAYMENT_METHODS).map((method, index) => {
                    const isDefault = formData.defaultPaymentMethod === method;
                    return (
                      <div
                        key={`${method}-${index}`}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isDefault 
                            ? 'bg-[#18181f] border-[#FF7A00]/50 shadow-md shadow-[#FF7A00]/5' 
                            : 'bg-[#141418] border-[#222228] hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="w-6 h-6 rounded-lg bg-[#202026] text-zinc-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-xs font-semibold text-white truncate">
                            {method}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSetDefaultPaymentMethod(method)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                              isDefault 
                                ? 'bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/40' 
                                : 'bg-[#202026] text-zinc-400 hover:text-white border border-transparent'
                            }`}
                            title={isDefault ? 'Forma de pagamento padrão' : 'Definir como padrão'}
                          >
                            <Star size={11} className={isDefault ? 'fill-[#FF7A00]' : ''} />
                            {isDefault ? 'Padrão' : 'Definir Padrão'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleRemovePaymentMethod(index)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            title="Remover forma de pagamento"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: PADRÕES DE ORÇAMENTO */}
        {activeTab === 'orcamentos' && (
          <div className="bg-[#0e0e11] border border-[#222226] rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-[#FF7A00]" />
                Termos, Prazos e Condições Padrão de Serviço
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Defina o prazo de validade, forma de pagamento e textos padrão carregados automaticamente nas propostas e ordens de serviço.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Validade do Orçamento */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#FF7A00]" />
                  Prazo de Validade Padrão
                </label>
                <div className="space-y-2">
                  <select
                    value={formData.defaultValidityDays}
                    onChange={(e) => setFormData({ ...formData, defaultValidityDays: parseInt(e.target.value) || 15 })}
                    className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                  >
                    <option value={5}>5 dias corridos</option>
                    <option value={7}>7 dias corridos</option>
                    <option value={10}>10 dias corridos</option>
                    <option value={15}>15 dias corridos (Recomendado)</option>
                    <option value={20}>20 dias corridos</option>
                    <option value={30}>30 dias corridos</option>
                    <option value={45}>45 dias corridos</option>
                    <option value={60}>60 dias corridos</option>
                    <option value={90}>90 dias corridos</option>
                  </select>
                  <p className="text-[10px] text-zinc-500">
                    O orçamento carregará este prazo por padrão com opção de troca rápida no dropdown.
                  </p>
                </div>
              </div>

              {/* Forma de Pagamento Padrão */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <CreditCard size={13} className="text-[#FF7A00]" />
                  Forma de Pagamento Padrão Selecionada
                </label>
                <select
                  value={formData.defaultPaymentMethod || (formData.paymentMethods?.[0] || 'PIX (À Vista)')}
                  onChange={(e) => setFormData({ ...formData, defaultPaymentMethod: e.target.value })}
                  className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                >
                  {(formData.paymentMethods || DEFAULT_PAYMENT_METHODS).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Pode ser gerenciada e expandida na aba &quot;Pagamento &amp; PIX&quot;.
                </p>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Observações e Condições de Pagamento Padrão (aparece na proposta)
                </label>
                <textarea
                  rows={4}
                  value={formData.defaultObservations}
                  onChange={(e) => setFormData({ ...formData, defaultObservations: e.target.value })}
                  className="w-full bg-[#141418] border border-[#27272e] rounded-xl p-3.5 text-xs text-zinc-200 focus:outline-none focus:border-[#FF7A00] leading-relaxed"
                  placeholder="• Orçamento válido por 15 dias corridos..."
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Termos de Garantia dos Serviços Prestados
                </label>
                <textarea
                  rows={3}
                  value={formData.warrantyTerms}
                  onChange={(e) => setFormData({ ...formData, warrantyTerms: e.target.value })}
                  className="w-full bg-[#141418] border border-[#27272e] rounded-xl p-3.5 text-xs text-zinc-200 focus:outline-none focus:border-[#FF7A00] leading-relaxed"
                  placeholder="Garantia de 90 dias sobre a mão de obra..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: SEGURANÇA & CONTROLE DE ACESSO (ADMIN EXCLUSIVO) */}
        {activeTab === 'seguranca' && isMasterAdmin && (
          <div className="bg-[#0e0e11] border border-blue-500/30 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#202028]">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-400" />
                  Painel de Controle de Acessos & Novos Cadastros
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Área restrita de administração para <strong className="text-blue-400">{userEmail}</strong>.
                </p>
              </div>
              <span className="text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-lg self-start">
                MASTER ADMIN
              </span>
            </div>

            {/* Toggle de Novos Cadastros */}
            <div className="bg-[#14141a] border border-[#262632] p-5 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {formData.allowRegistrations !== false ? (
                      <UserCheck size={18} className="text-emerald-400" />
                    ) : (
                      <UserX size={18} className="text-red-400" />
                    )}
                    <h3 className="text-sm font-bold text-white">Autorizar Novos Cadastros no Sistema</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Quando desativado, nenhum usuário externo conseguirá criar uma nova conta na tela inicial, protegendo todo o banco de dados e os orçamentos.
                  </p>
                </div>

                {/* Botão de Toggle */}
                <button
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    allowRegistrations: formData.allowRegistrations === false ? true : false 
                  })}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                    formData.allowRegistrations !== false
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/20'
                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 shadow-red-500/10'
                  }`}
                >
                  {formData.allowRegistrations !== false ? (
                    <>
                      <CheckCircle2 size={15} />
                      Cadastros LIBERADOS
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      Cadastros BLOQUEADOS
                    </>
                  )}
                </button>
              </div>

              <div className="pt-3 border-t border-[#1e1e26] flex items-center justify-between text-xs">
                <span className="text-zinc-400">Status atual:</span>
                <span className={`font-bold font-mono ${formData.allowRegistrations !== false ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formData.allowRegistrations !== false ? '● ATIVO (Permite novos registros)' : '■ FECHADO (Apenas login existente)'}
                </span>
              </div>
            </div>

            {/* Chave de Segurança Administrativa */}
            <div className="bg-[#14141a] border border-[#262632] p-5 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound size={17} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">Chave Mestra de Administração</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Chave de segurança interna do administrador para controle de permissões.
              </p>
              <div className="max-w-xs">
                <input
                  type="text"
                  value={formData.adminAuthKey || 'Davi'}
                  onChange={(e) => setFormData({ ...formData, adminAuthKey: e.target.value })}
                  className="w-full bg-[#0c0c10] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  placeholder="Davi"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sticky Save Bar */}
        <div className="p-4 bg-[#121216] border border-[#24242b] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Sparkles size={16} className="text-[#FF7A00]" />
            <span>As alterações são aplicadas instantaneamente a novos orçamentos e PDFs.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto bg-[#FF7A00] hover:bg-[#FF8A00] text-black text-xs font-black px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FF7A00]/20 disabled:opacity-50 uppercase tracking-wider"
          >
            <Save size={16} />
            {isSaving ? 'Salvando Alterações...' : 'Salvar Configurações'}
          </button>
        </div>

      </form>
    </div>
  );
}

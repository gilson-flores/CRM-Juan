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
  MapPin,
  QrCode,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import type { CompanySettings } from '@/lib/firebase';

export default function ConfiguracoesPage() {
  const { 
    companySettings, 
    updateSettings 
  } = useFirebaseData();

  const [activeTab, setActiveTab] = useState<'empresa' | 'financeiro' | 'orcamentos'>('empresa');
  const [formData, setFormData] = useState<CompanySettings>(companySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(companySettings);
  }, [companySettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const success = await updateSettings(formData);
    setIsSaving(false);

    if (success) {
      setStatusMessage({ text: 'Configurações salvas com sucesso!', type: 'success' });
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
                  <Mail size={13} className="text-[#FF7A00]" />
                  E-mail Comercial
                </label>
                <input
                  type="email"
                  placeholder="Ex: contato@jceletricista.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
          <div className="bg-[#0e0e11] border border-[#222226] rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
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
                Defina o texto padrão de garantias e condições que serão carregados automaticamente em cada novo orçamento gerado.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#FF7A00]" />
                  Validade do Orçamento (dias)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formData.defaultValidityDays}
                  onChange={(e) => setFormData({ ...formData, defaultValidityDays: parseInt(e.target.value) || 15 })}
                  className="w-full bg-[#141418] border border-[#27272e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF7A00]"
                />
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

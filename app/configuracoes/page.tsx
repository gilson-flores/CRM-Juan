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
  AlertCircle, 
  Save, 
  Check,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';

export default function ConfiguracoesPage() {
  const { 
    webAppUrl,
    syncAllData, 
    saveWebAppUrl,
    testWebAppConnection,
    importAllFromSheets,
    isConnected
  } = useGoogleSheets();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Apps Script Web App State
  const [webAppInput, setWebAppInput] = useState('');
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222226]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#141418] border border-[#27272a] rounded-xl text-[#FF7A00]">
            <Cloud size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Sincronização Nuvem & Google Sheets</h1>
            <p className="text-xs text-zinc-400">Configure a sua planilha para salvar clientes e orçamentos automaticamente.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
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
                    Cole o código abaixo e clique em <strong>Implantar &gt; Nova implantação</strong> (Selecione tipo: &quot;App da Web&quot;, Acesso: &quot;Qualquer pessoa&quot;). Copie a URL Gerada e cole acima.
                  </li>
                </ol>
              </div>
            )}
          </div>

          <div className="bg-[#141418] p-4 rounded-xl border border-[#27272e] flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
              <CheckCircle size={20} />
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
      </div>
    </div>
  );
}

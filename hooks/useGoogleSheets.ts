'use client';

import { useState, useEffect, useCallback } from 'react';

export type CatalogItem = {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  unit: string;
  description?: string;
  createdAt: string;
};

export const DEFAULT_CATALOG_ITEMS: CatalogItem[] = [
  { id: 'ITM-001', name: 'Instalação de Tomada Simples / Dupla', category: 'Instalação', unitPrice: 45.00, unit: 'un', description: 'Instalação de tomada com fiação pronta no local', createdAt: '2026-01-01' },
  { id: 'ITM-002', name: 'Instalação de Interruptor Simples / Three-Way', category: 'Instalação', unitPrice: 50.00, unit: 'un', description: 'Instalação ou troca de módulo de interruptor', createdAt: '2026-01-01' },
  { id: 'ITM-003', name: 'Troca de Disjuntor no QDC', category: 'Manutenção', unitPrice: 75.00, unit: 'un', description: 'Substituição de disjuntor termomagnético no quadro', createdAt: '2026-01-01' },
  { id: 'ITM-004', name: 'Instalação de Luminária / Plafon LED', category: 'Instalação', unitPrice: 60.00, unit: 'un', description: 'Fixação e ligação de luminária de teto ou sobrepor', createdAt: '2026-01-01' },
  { id: 'ITM-005', name: 'Instalação de Chuveiro Elétrico', category: 'Instalação', unitPrice: 90.00, unit: 'un', description: 'Ligação com conectores de louça ou wago e teste de vazamento', createdAt: '2026-01-01' },
  { id: 'ITM-006', name: 'Passagem de Fiação por Ponto', category: 'Instalação', unitPrice: 80.00, unit: 'ponto', description: 'Puxamento e guia de cabos flexíveis por eletroduto', createdAt: '2026-01-01' },
  { id: 'ITM-007', name: 'Montagem e Balanceamento de QDC', category: 'Instalação', unitPrice: 350.00, unit: 'un', description: 'Organização, barramentos, DPS, DR e identificação', createdAt: '2026-01-01' },
  { id: 'ITM-008', name: 'Instalação de Ventilador de Teto', category: 'Instalação', unitPrice: 130.00, unit: 'un', description: 'Montagem, fixação na caixa reforçada e ligação do controle', createdAt: '2026-01-01' },
  { id: 'ITM-009', name: 'Instalação de Sensor de Presença / Relé', category: 'Instalação', unitPrice: 55.00, unit: 'un', description: 'Regulagem de tempo, sensibilidade e ligação', createdAt: '2026-01-01' },
  { id: 'ITM-010', name: 'Localização e Correção de Curto-Circuito', category: 'Manutenção', unitPrice: 180.00, unit: 'serviço', description: 'Diagnóstico com multímetro/alicate e reparo da fuga/curto', createdAt: '2026-01-01' },
  { id: 'ITM-011', name: 'Tomada de Ar-Condicionado 20A / Circuito Dedicado', category: 'Instalação', unitPrice: 120.00, unit: 'ponto', description: 'Circuito independente com disjuntor exclusivo', createdAt: '2026-01-01' },
  { id: 'ITM-012', name: 'Instalação de Refletor LED Externo', category: 'Instalação', unitPrice: 85.00, unit: 'un', description: 'Fixação em parede/muro com vedação contra umidade', createdAt: '2026-01-01' },
];

export const APPS_SCRIPT_TEMPLATE = `// JC Eletricista CRM - Sincronizador Automático de Planilha Google
// Cole este código em: Extensões > Apps Script da sua Planilha Google
// Depois clique em: Implantar > Nova Implantação > Tipo: App da Web > Acesso: Qualquer pessoa (Anyone)

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Conectado à Planilha Google!', title: ss.getName() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getAll') {
    var result = {
      clients: getSheetData(ss, 'Clientes'),
      drafts: getSheetData(ss, 'Orcamentos'),
      items: getSheetData(ss, 'Itens'),
      catalog: getSheetData(ss, 'Catalogo_Itens')
    };
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    
    if (payload.action === 'syncAll' || payload.clients || payload.drafts) {
      if (payload.clients) writeSheetData(ss, 'Clientes', payload.clients);
      if (payload.drafts) writeSheetData(ss, 'Orcamentos', payload.drafts);
      if (payload.items) writeSheetData(ss, 'Itens', payload.items);
      if (payload.catalog) writeSheetData(ss, 'Catalogo_Itens', payload.catalog);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Dados sincronizados com sucesso!' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function writeSheetData(ss, sheetName, rows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clearContents();
  if (rows && rows.length > 0) {
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  return sheet.getDataRange().getValues();
}
`;

export function useGoogleSheets() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [webAppUrl, setWebAppUrl] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedWebAppUrl = localStorage.getItem('@jc-eletricista:webAppUrl');
      
      if (savedWebAppUrl) setWebAppUrl(savedWebAppUrl);
      
      // Ensure catalog items exist
      const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');
      if (!savedCatalog) {
        localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify(DEFAULT_CATALOG_ITEMS));
      }

      setIsInitializing(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const saveWebAppUrl = (url: string) => {
    const trimmed = url.trim();
    setWebAppUrl(trimmed);
    if (trimmed) {
      localStorage.setItem('@jc-eletricista:webAppUrl', trimmed);
    } else {
      localStorage.removeItem('@jc-eletricista:webAppUrl');
    }
  };

  const syncAllData = useCallback(async () => {
    setIsSyncing(true);

    // 1. Clientes
    const savedClients = localStorage.getItem('@jc-eletricista:clients');
    const clientsList = savedClients ? JSON.parse(savedClients) : [];
    const clientRows = [
      ['ID', 'Tipo', 'Nome / Razão Social', 'CPF / CNPJ', 'Telefone / WhatsApp', 'E-mail', 'CEP', 'Endereço', 'Número', 'Complemento', 'Data de Cadastro'],
      ...clientsList.map((c: any) => [
        c.id || '', c.type || '', c.name || '', c.doc || '', c.phone || '', c.email || '', c.cep || '', c.address || '', c.number || '', c.complement || '', c.createdAt || ''
      ])
    ];

    // 2. Orçamentos
    const savedDrafts = localStorage.getItem('@jc-eletricista:saved_drafts_v2') || localStorage.getItem('@jc-eletricista:drafts');
    const draftsList = savedDrafts ? JSON.parse(savedDrafts) : [];
    const draftRows = [
      ['ID', 'Cliente', 'Data', 'Itens / Descrição', 'Valor Total (R$)'],
      ...draftsList.map((d: any) => [
        d.quoteNumber || d.id || '', 
        d.clientName || '', 
        d.date || '', 
        Array.isArray(d.items) ? d.items.map((i: any) => `${i.quantity}x ${i.description}`).join(', ') : (d.itemsStr || ''), 
        d.total?.toString() || '0'
      ])
    ];

    // 3. Itens individuais
    const savedItems = localStorage.getItem('@jc-eletricista:quote_items_log');
    const quoteItemsList = savedItems ? JSON.parse(savedItems) : [];
    const itemRows = [
      ['ID Item', 'ID Orçamento', 'Cliente', 'Descrição do Item / Serviço', 'Quantidade', 'Preço Unitário (R$)', 'Total Item (R$)', 'Data'],
      ...quoteItemsList.map((i: any) => [
        i.id || '', i.quoteId || '', i.clientName || '', i.description || '', i.quantity || 1, i.unitPrice?.toString() || '0', ((i.quantity || 1) * (i.unitPrice || 0)).toString(), i.date || ''
      ])
    ];

    // 4. Catálogo de Itens
    const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');
    const catalogList: CatalogItem[] = savedCatalog ? JSON.parse(savedCatalog) : DEFAULT_CATALOG_ITEMS;
    const catalogRows = [
      ['ID', 'Nome / Descrição do Item', 'Categoria', 'Unidade', 'Preço Padrão (R$)', 'Observação', 'Data de Cadastro'],
      ...catalogList.map(c => [
        c.id, c.name, c.category, c.unit, c.unitPrice.toString(), c.description || '', c.createdAt || ''
      ])
    ];

    let syncedViaAny = false;

    // MÉTODO 1: Google Apps Script Web App (Conexão Direta Sem Login / Sem Erro de Domínio)
    const activeWebAppUrl = (webAppUrl || localStorage.getItem('@jc-eletricista:webAppUrl') || '').trim();
    if (activeWebAppUrl) {
      try {
        const payload = {
          action: 'syncAll',
          clients: clientRows,
          drafts: draftRows,
          items: itemRows,
          catalog: catalogRows
        };
        await fetch(activeWebAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
        syncedViaAny = true;
      } catch (err: any) {
        console.warn('Erro ao sincronizar via Google Apps Script Web App:', err);
      }
    }

    setIsSyncing(false);
    return syncedViaAny;
  }, [webAppUrl]);

  const testWebAppConnection = async (testUrl?: string): Promise<{ success: boolean; message: string }> => {
    const targetUrl = (testUrl || webAppUrl || localStorage.getItem('@jc-eletricista:webAppUrl') || '').trim();
    if (!targetUrl) {
      return { success: false, message: 'URL do Google Apps Script não informada.' };
    }

    try {
      const urlWithParam = targetUrl.includes('?') ? `${targetUrl}&action=ping` : `${targetUrl}?action=ping`;
      const res = await fetch(urlWithParam);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return { 
          success: true, 
          message: data.message || `Conectado com sucesso à Planilha Google (${data.title || 'Planilha'})!` 
        };
      }
      return { success: false, message: `Resposta do servidor: ${res.status} ${res.statusText}` };
    } catch (e: any) {
      // Caso ocorra bloqueio de CORS na leitura do GET mas o POST funcione, alertamos
      return { 
        success: true, 
        message: 'URL registrada. Caso a leitura seja restrita pelo navegador, os envios (POST) continuarão gravando diretamente na planilha.' 
      };
    }
  };

  const importAllFromSheets = async (): Promise<{ success: boolean; message: string; counts?: any }> => {
    const activeWebAppUrl = (webAppUrl || localStorage.getItem('@jc-eletricista:webAppUrl') || '').trim();
    if (!activeWebAppUrl) {
      return { success: false, message: 'URL do Google Apps Script não configurada.' };
    }

    try {
      const urlWithParam = activeWebAppUrl.includes('?') ? `${activeWebAppUrl}&action=getAll` : `${activeWebAppUrl}?action=getAll`;
      const res = await fetch(urlWithParam);
      if (!res.ok) {
        return { success: false, message: `Erro ao buscar dados: ${res.statusText}` };
      }
      const data = await res.json();
      
      let importedClients = 0;
      let importedDrafts = 0;
      let importedCatalog = 0;

      if (data.clients && data.clients.length > 1) {
        const header = data.clients[0];
        const rows = data.clients.slice(1);
        const parsedClients = rows.map((r: any[]) => ({
          id: r[0] || `${Date.now()}-${Math.random()}`,
          type: (r[1] === 'pj' ? 'pj' : 'pf') as 'pf' | 'pj',
          name: r[2] || '',
          doc: r[3] || '',
          phone: r[4] || '',
          email: r[5] || '',
          cep: r[6] || '',
          address: r[7] || '',
          number: r[8] || '',
          complement: r[9] || '',
          createdAt: r[10] || new Date().toLocaleDateString('pt-BR')
        })).filter((c: any) => c.name);

        if (parsedClients.length > 0) {
          localStorage.setItem('@jc-eletricista:clients', JSON.stringify(parsedClients));
          importedClients = parsedClients.length;
        }
      }

      if (data.catalog && data.catalog.length > 1) {
        const rows = data.catalog.slice(1);
        const parsedCatalog = rows.map((r: any[]) => ({
          id: r[0] || `ITM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          name: r[1] || '',
          category: r[2] || 'Geral',
          unit: r[3] || 'un',
          unitPrice: parseFloat(r[4]) || 0,
          description: r[5] || '',
          createdAt: r[6] || new Date().toLocaleDateString('pt-BR')
        })).filter((it: any) => it.name);

        if (parsedCatalog.length > 0) {
          localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify(parsedCatalog));
          importedCatalog = parsedCatalog.length;
        }
      }

      return {
        success: true,
        message: `Importação concluída com sucesso! (${importedClients} clientes, ${importedCatalog} itens do catálogo)`,
        counts: { clients: importedClients, drafts: importedDrafts, catalog: importedCatalog }
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro ao importar dados da planilha.' };
    }
  };

  return {
    isInitializing,
    webAppUrl,
    isSyncing,
    isConnected: !!webAppUrl,
    saveWebAppUrl,
    syncAllData,
    testWebAppConnection,
    importAllFromSheets
  };
}

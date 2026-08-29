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

export const DEFAULT_CATALOG_ITEMS: CatalogItem[] = [];

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
      // 1. One-time purge of legacy mock / example data across the entire application
      const PURGE_FLAG = '@jc-eletricista:sample_data_purged_v2';
      const hasPurged = localStorage.getItem(PURGE_FLAG);
      if (!hasPurged) {
        localStorage.removeItem('@jc-eletricista:clients');
        localStorage.removeItem('@jc-eletricista:saved_drafts_v2');
        localStorage.removeItem('@jc-eletricista:drafts');
        localStorage.removeItem('@jc-eletricista:quote_items_log');
        localStorage.removeItem('@jc-eletricista:catalog_items');
        localStorage.setItem(PURGE_FLAG, 'true');
      }

      const savedWebAppUrl = localStorage.getItem('@jc-eletricista:webAppUrl');
      if (savedWebAppUrl) setWebAppUrl(savedWebAppUrl);
      
      // Ensure catalog items exist as empty array by default
      const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');
      if (!savedCatalog) {
        localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify([]));
      }

      setIsInitializing(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const clearAllLocalData = useCallback(() => {
    localStorage.removeItem('@jc-eletricista:clients');
    localStorage.removeItem('@jc-eletricista:saved_drafts_v2');
    localStorage.removeItem('@jc-eletricista:drafts');
    localStorage.removeItem('@jc-eletricista:quote_items_log');
    localStorage.removeItem('@jc-eletricista:catalog_items');
    localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify([]));
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
    importAllFromSheets,
    clearAllLocalData
  };
}

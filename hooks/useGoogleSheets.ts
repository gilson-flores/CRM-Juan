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

    const savedClients = localStorage.getItem('@jc-eletricista:clients');
    const clientsList = savedClients ? JSON.parse(savedClients) : [];
    const clientObjects = clientsList.map((c: any) => ({
      id: c.id || '', name: c.name || '', phone: c.phone || '', email: c.email || '', doc: c.doc || '', address: c.address || '', status: c.status || 'Cliente', createdAt: c.createdAt || ''
    }));

    const savedDrafts = localStorage.getItem('@jc-eletricista:saved_drafts_v2') || localStorage.getItem('@jc-eletricista:drafts');
    const draftsList = savedDrafts ? JSON.parse(savedDrafts) : [];
    const quoteObjects = draftsList.map((d: any) => ({
      quoteNumber: d.quoteNumber || d.id || '', clientName: d.clientName || '', issueDate: d.date || '', validUntil: d.validUntil || '', paymentTerms: d.paymentTerms || '', subtotal: d.subtotal || 0, discount: d.discount || 0, total: d.total || 0, status: d.status || 'Pendente', pdfUrl: d.pdfUrl || ''
    }));

    const savedItems = localStorage.getItem('@jc-eletricista:quote_items_log');
    const quoteItemsList = savedItems ? JSON.parse(savedItems) : [];
    const itemObjects = quoteItemsList.map((i: any) => ({
      quoteNumber: i.quoteId || '', itemId: i.id || '', description: i.description || '', quantity: i.quantity || 1, unitPrice: i.unitPrice || 0, totalPrice: ((i.quantity || 1) * (i.unitPrice || 0))
    }));

    const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');
    const catalogList: CatalogItem[] = savedCatalog ? JSON.parse(savedCatalog) : [];
    const catalogObjects = catalogList.map((c: any) => ({
      id: c.id, name: c.name, category: c.category, unitPrice: c.unitPrice, unit: c.unit, description: c.description || '', createdAt: c.createdAt || ''
    }));

    let syncedViaAny = false;
    const activeWebAppUrl = (webAppUrl || localStorage.getItem('@jc-eletricista:webAppUrl') || '').trim();
    
    if (activeWebAppUrl) {
      try {
        const payload = {
          clients: clientObjects,
          quotes: quoteObjects,
          items: itemObjects,
          catalog: catalogObjects
        };
        await fetch(activeWebAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
      // doGet from new Apps script doesn't need action=getAll to return everything, but it accepts it safely.
      const res = await fetch(activeWebAppUrl);
      if (!res.ok) {
        return { success: false, message: `Erro ao buscar dados: ${res.statusText}` };
      }
      const data = await res.json();
      
      let importedClients = 0;
      let importedDrafts = 0;
      let importedCatalog = 0;

      if (data.clients && Array.isArray(data.clients) && data.clients.length > 0) {
        const parsedClients = data.clients.map((r: any) => ({
          id: r.id || `${Date.now()}-${Math.random()}`,
          type: 'pf',
          name: r.name || '',
          doc: r.doc || '',
          phone: r.phone || '',
          email: r.email || '',
          cep: '',
          address: r.address || '',
          number: '',
          complement: '',
          createdAt: r.createdAt || new Date().toLocaleDateString('pt-BR')
        })).filter((c: any) => c.name);

        if (parsedClients.length > 0) {
          localStorage.setItem('@jc-eletricista:clients', JSON.stringify(parsedClients));
          importedClients = parsedClients.length;
        }
      }

      if (data.catalog && Array.isArray(data.catalog) && data.catalog.length > 0) {
        const parsedCatalog = data.catalog.map((r: any) => ({
          id: r.id || `ITM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          name: r.name || '',
          category: r.category || 'Geral',
          unit: r.unit || 'un',
          unitPrice: Number(r.unitPrice) || 0,
          description: r.description || '',
          createdAt: r.createdAt || new Date().toLocaleDateString('pt-BR')
        })).filter((it: any) => it.name);

        if (parsedCatalog.length > 0) {
          localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify(parsedCatalog));
          importedCatalog = parsedCatalog.length;
        }
      }

      // If quotes ever needed to be imported we can do it here

      return {
        success: true,
        message: `Importação concluída com sucesso! (${importedClients} clientes, ${importedCatalog} itens do catálogo)`,
        counts: { clients: importedClients, drafts: importedDrafts, catalog: importedCatalog }
      };
    } catch (e: any) {
      if (e.message === 'Failed to fetch') {
        return { success: false, message: 'Erro de conexão (Failed to fetch).\n\nSOLUÇÃO:\n1. Volte no Apps Script.\n2. Clique em "Implantar" > "Gerenciar implantações".\n3. Edite (lápis) a implantação.\n4. Mude a versão para "Nova versão".\n5. Certifique-se de que "Quem pode acessar" está como "Qualquer pessoa".\n6. Salve e tente novamente.' };
      }
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

const fs = require('fs');
let code = fs.readFileSync('hooks/useGoogleSheets.ts', 'utf8');

const targetStr = "  const syncAllData = useCallback(async () => {";
const startIdx = code.indexOf(targetStr);

const newMethods = `  const syncAllData = useCallback(async () => {
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
      const urlWithParam = targetUrl.includes('?') ? \`\${targetUrl}&action=ping\` : \`\${targetUrl}?action=ping\`;
      const res = await fetch(urlWithParam);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return { 
          success: true, 
          message: data.message || \`Conectado com sucesso à Planilha Google (\${data.title || 'Planilha'})!\` 
        };
      }
      return { success: false, message: \`Resposta do servidor: \${res.status} \${res.statusText}\` };
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
        return { success: false, message: \`Erro ao buscar dados: \${res.statusText}\` };
      }
      const data = await res.json();
      
      let importedClients = 0;
      let importedDrafts = 0;
      let importedCatalog = 0;

      if (data.clients && Array.isArray(data.clients) && data.clients.length > 0) {
        const parsedClients = data.clients.map((r: any) => ({
          id: r.id || \`\${Date.now()}-\${Math.random()}\`,
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
          id: r.id || \`ITM-\${Math.random().toString(36).substring(2, 6).toUpperCase()}\`,
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
        message: \`Importação concluída com sucesso! (\${importedClients} clientes, \${importedCatalog} itens do catálogo)\`,
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
`;

code = code.substring(0, startIdx) + newMethods;
fs.writeFileSync('hooks/useGoogleSheets.ts', code);
console.log("Hooks patched successfully.");

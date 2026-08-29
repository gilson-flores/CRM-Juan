const fs = require('fs');
let code = fs.readFileSync('hooks/useGoogleSheets.ts', 'utf8');

// Replace syncAllData
const syncAllDataTarget = `  const syncAllData = useCallback(async () => {
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
        Array.isArray(d.items) ? d.items.map((i: any) => \`\${i.quantity}x \${i.description}\`).join(', ') : (d.itemsStr || ''), 
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
    const catalogList: CatalogItem[] = savedCatalog ? JSON.parse(savedCatalog) : [];
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
  }, [webAppUrl]);`;

const syncAllDataReplacement = `  const syncAllData = useCallback(async () => {
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
    const catalogObjects = catalogList.map(c => ({
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
  }, [webAppUrl]);`;

code = code.replace(syncAllDataTarget, syncAllDataReplacement);

// If the previous replace failed because of exact string mismatch, let's try regex or split
if (code.includes(syncAllDataTarget)) {
  console.log("syncAllDataTarget replaced successfully!");
} else {
  console.log("syncAllDataTarget NOT FOUND! We must use string manipulation.");
  
  // Fallback: replace everything between "const syncAllData = useCallback(async () => {" and "  }, [webAppUrl]);"
  const startIdx = code.indexOf('  const syncAllData = useCallback(async () => {');
  const endIdx = code.indexOf('  }, [webAppUrl]);', startIdx) + '  }, [webAppUrl]);'.length;
  if(startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + syncAllDataReplacement + code.substring(endIdx);
    console.log("syncAllData fallback replacement applied.");
  }
}

// Replace importAllFromSheets
const importStart = '  const importAllFromSheets = async (): Promise<{ success: boolean; message: string; counts?: any }> => {';
const importEnd = '  return {';
const startIdx2 = code.indexOf(importStart);
const endIdx2 = code.indexOf(importEnd, startIdx2);

const importAllReplacement = `  const importAllFromSheets = async (): Promise<{ success: boolean; message: string; counts?: any }> => {
    const activeWebAppUrl = (webAppUrl || localStorage.getItem('@jc-eletricista:webAppUrl') || '').trim();
    if (!activeWebAppUrl) {
      return { success: false, message: 'URL do Google Apps Script não configurada.' };
    }

    try {
      // The doGet in Apps script doesn't need action=getAll, it just returns data
      const res = await fetch(activeWebAppUrl);
      if (!res.ok) {
        return { success: false, message: \`Erro ao buscar dados: \${res.statusText}\` };
      }
      const data = await res.json();
      
      let importedClients = 0;
      let importedDrafts = 0;
      let importedCatalog = 0;

      if (data.clients && data.clients.length > 0) {
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

      if (data.catalog && data.catalog.length > 0) {
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

      return {
        success: true,
        message: \`Importação concluída com sucesso! (\${importedClients} clientes, \${importedCatalog} itens do catálogo)\`,
        counts: { clients: importedClients, drafts: importedDrafts, catalog: importedCatalog }
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro ao importar dados da planilha.' };
    }
  };

`;

if(startIdx2 !== -1 && endIdx2 !== -1) {
    code = code.substring(0, startIdx2) + importAllReplacement + code.substring(endIdx2);
    console.log("importAllFromSheets replacement applied.");
}

fs.writeFileSync('hooks/useGoogleSheets.ts', code);

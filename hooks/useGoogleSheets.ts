'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { googleSignIn, initAuth, logout as firebaseLogout, setAccessToken } from '@/lib/firebaseAuth';
import firebaseConfig from '../firebase-applet-config.json';

declare const google: any;

const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";

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

export function useGoogleSheets() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCreatingSpreadsheet, setIsCreatingSpreadsheet] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [customClientId, setCustomClientId] = useState<string>('');
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedId = localStorage.getItem('@jc-eletricista:spreadsheetId');
      const savedClientId = localStorage.getItem('@jc-eletricista:clientId');
      if (savedId) setSpreadsheetId(savedId);
      if (savedClientId) setCustomClientId(savedClientId);
      
      // Ensure catalog items exist
      const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');
      if (!savedCatalog) {
        localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify(DEFAULT_CATALOG_ITEMS));
      }

      setIsInitializing(false);
    }, 0);

    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const activeClientId = customClientId.trim() || firebaseConfig.oAuthClientId || process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || '';

  const saveCustomClientId = (newId: string) => {
    const trimmed = newId.trim();
    setCustomClientId(trimmed);
    if (trimmed) {
      localStorage.setItem('@jc-eletricista:clientId', trimmed);
    } else {
      localStorage.removeItem('@jc-eletricista:clientId');
    }
  };

  const createSpreadsheet = useCallback(async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) {
      setLastError('Usuário não autenticado no Google.');
      return null;
    }
    
    setIsCreatingSpreadsheet(true);
    setLastError(null);

    try {
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: 'JC Eletricista - Base de Dados',
          },
          sheets: [
            {
              properties: {
                title: 'Clientes',
                gridProperties: { rowCount: 200, columnCount: 12, frozenRowCount: 1 }
              }
            },
            {
              properties: {
                title: 'Orcamentos',
                gridProperties: { rowCount: 200, columnCount: 10, frozenRowCount: 1 }
              }
            },
            {
              properties: {
                title: 'Itens',
                gridProperties: { rowCount: 500, columnCount: 10, frozenRowCount: 1 }
              }
            },
            {
              properties: {
                title: 'Catalogo_Itens',
                gridProperties: { rowCount: 200, columnCount: 8, frozenRowCount: 1 }
              }
            }
          ]
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || response.statusText || 'Erro ao criar planilha';
        console.error('Error creating spreadsheet:', errMsg, errJson);
        setLastError(errMsg);
        setIsCreatingSpreadsheet(false);
        return null;
      }

      const data = await response.json();
      const id = data.spreadsheetId;
      setSpreadsheetId(id);
      localStorage.setItem('@jc-eletricista:spreadsheetId', id);

      // Preencher abas com cabeçalhos e dados existentes
      const savedClients = localStorage.getItem('@jc-eletricista:clients');
      const clientsList = savedClients ? JSON.parse(savedClients) : [];
      const clientRows = [
        ['ID', 'Tipo', 'Nome / Razão Social', 'CPF / CNPJ', 'Telefone / WhatsApp', 'E-mail', 'CEP', 'Endereço', 'Número', 'Complemento', 'Data de Cadastro'],
        ...clientsList.map((c: any) => [
          c.id || '', c.type || '', c.name || '', c.doc || '', c.phone || '', c.email || '', c.cep || '', c.address || '', c.number || '', c.complement || '', c.createdAt || ''
        ])
      ];

      const savedDrafts = localStorage.getItem('@jc-eletricista:drafts');
      const draftsList = savedDrafts ? JSON.parse(savedDrafts) : [];
      const draftRows = [
        ['ID', 'Cliente', 'Data', 'Itens / Descrição', 'Valor Total (R$)'],
        ...draftsList.map((d: any) => [
          d.id || '', d.clientName || '', d.date || '', d.itemsStr || '', d.total?.toString() || '0'
        ])
      ];

      // Itens individuais dos orçamentos
      const savedItems = localStorage.getItem('@jc-eletricista:quote_items_log');
      const quoteItemsList = savedItems ? JSON.parse(savedItems) : [];
      const itemRows = [
        ['ID Item', 'ID Orçamento', 'Cliente', 'Descrição do Item / Serviço', 'Quantidade', 'Preço Unitário (R$)', 'Total Item (R$)', 'Data'],
        ...quoteItemsList.map((i: any) => [
          i.id || '', i.quoteId || '', i.clientName || '', i.description || '', i.quantity || 1, i.unitPrice?.toString() || '0', ((i.quantity || 1) * (i.unitPrice || 0)).toString(), i.date || ''
        ])
      ];

      // Catálogo de Itens
      const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');
      const catalogList: CatalogItem[] = savedCatalog ? JSON.parse(savedCatalog) : DEFAULT_CATALOG_ITEMS;
      const catalogRows = [
        ['ID', 'Nome / Descrição do Item', 'Categoria', 'Unidade', 'Preço Padrão (R$)', 'Observação', 'Data de Cadastro'],
        ...catalogList.map(c => [
          c.id, c.name, c.category, c.unit, c.unitPrice.toString(), c.description || '', c.createdAt || ''
        ])
      ];

      // Populate sheets
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Clientes!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${activeToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: clientRows })
      });

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Orcamentos!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${activeToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: draftRows })
      });

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Itens!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${activeToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: itemRows })
      });

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Catalogo_Itens!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${activeToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: catalogRows })
      });

      setIsCreatingSpreadsheet(false);
      return id;
    } catch (e: any) {
      console.error('Failed to create spreadsheet:', e);
      setLastError(e.message || 'Erro inesperado ao criar planilha.');
      setIsCreatingSpreadsheet(false);
      return null;
    }
  }, [token]);

  const syncDataToSheets = useCallback(async (sheetName: string, values: any[][], customToken?: string) => {
    const activeToken = customToken || token;
    if (!activeToken) return;
    let currentId = spreadsheetId || localStorage.getItem('@jc-eletricista:spreadsheetId');
    
    if (!currentId) {
      currentId = await createSpreadsheet(activeToken);
      if (!currentId) return;
    }

    try {
      // Clear current sheet
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentId}/values/${sheetName}!A:Z:clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
        },
      });

      // Update with new values
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values,
        }),
      });
    } catch (e) {
      console.error('Failed to sync to sheets', e);
    }
  }, [token, spreadsheetId, createSpreadsheet]);

  const syncAllData = useCallback(async (activeAuthToken?: string) => {
    const activeToken = activeAuthToken || token;
    if (!activeToken) return false;

    let currentId = spreadsheetId || localStorage.getItem('@jc-eletricista:spreadsheetId');
    if (!currentId) {
      currentId = await createSpreadsheet(activeToken);
      return !!currentId;
    }

    // Verify if spreadsheet exists
    try {
      const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${currentId}?fields=spreadsheetId`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (!checkRes.ok) {
        currentId = await createSpreadsheet(activeToken);
        if (!currentId) return false;
      }
    } catch {
      currentId = await createSpreadsheet(activeToken);
      if (!currentId) return false;
    }

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
    const savedDrafts = localStorage.getItem('@jc-eletricista:drafts');
    const draftsList = savedDrafts ? JSON.parse(savedDrafts) : [];
    const draftRows = [
      ['ID', 'Cliente', 'Data', 'Itens / Descrição', 'Valor Total (R$)'],
      ...draftsList.map((d: any) => [
        d.id || '', d.clientName || '', d.date || '', d.itemsStr || '', d.total?.toString() || '0'
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

    await syncDataToSheets('Clientes', clientRows, activeToken);
    await syncDataToSheets('Orcamentos', draftRows, activeToken);
    await syncDataToSheets('Itens', itemRows, activeToken);
    await syncDataToSheets('Catalogo_Itens', catalogRows, activeToken);
    return true;
  }, [token, spreadsheetId, createSpreadsheet, syncDataToSheets]);

  const login = useCallback(async () => {
    setLastError(null);
    try {
      const result = await googleSignIn();
      if (result?.accessToken) {
        setToken(result.accessToken);
        setUser(result.user);
        setAccessToken(result.accessToken);
        await syncAllData(result.accessToken);
        return;
      }
    } catch (firebaseErr: any) {
      console.warn('Firebase signInWithPopup fallback to Google GSI:', firebaseErr);
      
      const errorCode = firebaseErr?.code || '';
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      
      const currentClientId = (localStorage.getItem('@jc-eletricista:clientId') || activeClientId || '').trim();
      if (!currentClientId) {
        setLastError(`ID de cliente OAuth não configurado. Adicione o Client ID do Google Cloud nas configurações.`);
        return;
      }

      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        if (errorCode === 'auth/unauthorized-domain') {
          setLastError(`Domínio não autorizado no Firebase (${currentOrigin}). Adicione esta URL em Firebase Console > Authentication > Configurações > Domínios Autorizados, ou configure as Origens JavaScript no Google Cloud Console.`);
        } else {
          setLastError('Aguardando carregamento da biblioteca do Google. Tente novamente em alguns segundos.');
        }
        return;
      }

      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: currentClientId,
          scope: SCOPES,
          callback: async (response: any) => {
            if (response.error !== undefined) {
              console.error('OAuth callback error:', response);
              if (response.error === 'origin_mismatch' || response.error_description?.includes('origin_mismatch')) {
                setLastError(`Erro 400 (origin_mismatch): A URL "${currentOrigin}" precisa ser adicionada em "Origens JavaScript autorizadas" no Google Cloud Console.`);
              } else {
                setLastError(response.error_description || response.error || 'Erro na autenticação com Google.');
              }
              return;
            }
            setToken(response.access_token);
            setAccessToken(response.access_token);
            await syncAllData(response.access_token);
          },
        });
        client.requestAccessToken();
      } catch (gsiErr: any) {
        setLastError(gsiErr.message || 'Erro ao inicializar autenticação com o Google.');
      }
    }
  }, [activeClientId, syncAllData]);

  const logout = useCallback(async () => {
    await firebaseLogout();
    setToken(null);
    setUser(null);
    setAccessToken(null);
  }, []);

  const fetchDataFromSheets = useCallback(async (sheetName: string) => {
    if (!token || !spreadsheetId) return null;
    try {
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:Z`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data.values || [];
    } catch (e) {
      console.error('Failed to fetch from sheets', e);
      return null;
    }
  }, [token, spreadsheetId]);

  return {
    login,
    logout,
    token,
    user,
    isInitializing,
    isCreatingSpreadsheet,
    spreadsheetId,
    activeClientId,
    customClientId,
    lastError,
    saveCustomClientId,
    createSpreadsheet,
    syncAllData,
    syncDataToSheets,
    fetchDataFromSheets
  };
}

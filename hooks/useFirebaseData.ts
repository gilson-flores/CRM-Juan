'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logoutUser, 
  getCompanySettings, 
  saveCompanySettings, 
  syncAllLocalDataToFirestore,
  DEFAULT_COMPANY_SETTINGS, 
  type CompanySettings 
} from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import type { Client } from '@/app/clientes/page';
import type { FullDraft } from '@/app/orcamentos/page';
import type { CatalogItem } from '@/hooks/useGoogleSheets';

export function useFirebaseData() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  
  // Local state mirrored with cloud
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<FullDraft[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Initial load from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('@jc-eletricista:company_settings');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedSettings) setCompanySettings(JSON.parse(savedSettings));

      const savedClients = localStorage.getItem('@jc-eletricista:clients');
      if (savedClients) setClients(JSON.parse(savedClients));

      const savedQuotes = localStorage.getItem('@jc-eletricista:saved_drafts_v2');
      if (savedQuotes) setQuotes(JSON.parse(savedQuotes));

      const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');
      if (savedCatalog) setCatalog(JSON.parse(savedCatalog));
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
  }, []);

  // 3. Firestore Realtime Listeners
  useEffect(() => {
    // Company settings
    getCompanySettings().then(setCompanySettings).catch(console.warn);

    // Clients listener
    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      if (!snapshot.empty) {
        const list: Client[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Client);
        });
        if (list.length > 0) {
          setClients(list);
          localStorage.setItem('@jc-eletricista:clients', JSON.stringify(list));
        }
      }
    }, (err) => console.warn('Clients sync listener:', err));

    // Quotes listener
    const unsubQuotes = onSnapshot(collection(db, 'quotes'), (snapshot) => {
      if (!snapshot.empty) {
        const list: FullDraft[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as FullDraft);
        });
        if (list.length > 0) {
          setQuotes(list);
          localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(list));
        }
      }
    }, (err) => console.warn('Quotes sync listener:', err));

    // Catalog listener
    const unsubCatalog = onSnapshot(collection(db, 'catalog'), (snapshot) => {
      if (!snapshot.empty) {
        const list: CatalogItem[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as CatalogItem);
        });
        if (list.length > 0) {
          setCatalog(list);
          localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify(list));
        }
      }
    }, (err) => console.warn('Catalog sync listener:', err));

    return () => {
      unsubClients();
      unsubQuotes();
      unsubCatalog();
    };
  }, []);

  // Actions
  const updateSettings = useCallback(async (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    return await saveCompanySettings(newSettings);
  }, []);

  const saveClient = useCallback(async (client: Client) => {
    const updated = [client, ...clients.filter(c => c.id !== client.id)];
    setClients(updated);
    localStorage.setItem('@jc-eletricista:clients', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'clients', String(client.id)), client, { merge: true });
    } catch (e) {
      console.warn('Could not push client to Firestore immediately:', e);
    }
  }, [clients]);

  const deleteClient = useCallback(async (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    localStorage.setItem('@jc-eletricista:clients', JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, 'clients', String(id)));
    } catch (e) {
      console.warn('Could not delete client from Firestore:', e);
    }
  }, [clients]);

  const saveQuote = useCallback(async (quote: FullDraft) => {
    const updated = [quote, ...quotes.filter(q => q.id !== quote.id)];
    setQuotes(updated);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'quotes', String(quote.id)), quote, { merge: true });
    } catch (e) {
      console.warn('Could not push quote to Firestore immediately:', e);
    }
  }, [quotes]);

  const deleteQuote = useCallback(async (id: string) => {
    const updated = quotes.filter(q => q.id !== id);
    setQuotes(updated);
    localStorage.setItem('@jc-eletricista:saved_drafts_v2', JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, 'quotes', String(id)));
    } catch (e) {
      console.warn('Could not delete quote from Firestore:', e);
    }
  }, [quotes]);

  const saveCatalogItem = useCallback(async (item: CatalogItem) => {
    const updated = [item, ...catalog.filter(i => i.id !== item.id)];
    setCatalog(updated);
    localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'catalog', String(item.id)), item, { merge: true });
    } catch (e) {
      console.warn('Could not push catalog item to Firestore immediately:', e);
    }
  }, [catalog]);

  const deleteCatalogItem = useCallback(async (id: string) => {
    const updated = catalog.filter(i => i.id !== id);
    setCatalog(updated);
    localStorage.setItem('@jc-eletricista:catalog_items', JSON.stringify(updated));
    try {
      await deleteDoc(doc(db, 'catalog', String(id)));
    } catch (e) {
      console.warn('Could not delete catalog item from Firestore:', e);
    }
  }, [catalog]);

  const forceSync = useCallback(async () => {
    setIsSyncing(true);
    const res = await syncAllLocalDataToFirestore();
    setIsSyncing(false);
    return res;
  }, []);

  const clearAllData = useCallback(() => {
    localStorage.removeItem('@jc-eletricista:clients');
    localStorage.removeItem('@jc-eletricista:saved_drafts_v2');
    localStorage.removeItem('@jc-eletricista:quote_items_log');
    localStorage.removeItem('@jc-eletricista:catalog_items');
    setClients([]);
    setQuotes([]);
    setCatalog([]);
  }, []);

  return {
    user,
    authLoading,
    isSyncing,
    companySettings,
    updateSettings,
    clients,
    saveClient,
    deleteClient,
    quotes,
    saveQuote,
    deleteQuote,
    catalog,
    saveCatalogItem,
    deleteCatalogItem,
    forceSync,
    clearAllData,
    loginGoogle: loginWithGoogle,
    logout: logoutUser,
    isConnected: true
  };
}

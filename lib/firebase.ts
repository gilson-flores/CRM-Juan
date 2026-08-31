import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, type User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAt97Yjy9jdI5Sprx7XGUvpcV0qafgkHH4",
  authDomain: "crm-juan-7c618.firebaseapp.com",
  projectId: "crm-juan-7c618",
  storageBucket: "crm-juan-7c618.firebasestorage.app",
  messagingSenderId: "409673429310",
  appId: "1:409673429310:web:35f2a5dbfd41117ca6bc6f"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use named database if specified in config, otherwise fallback to default
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export type CompanySettings = {
  companyName: string;
  slogan: string;
  ownerName: string;
  doc: string;
  phone: string;
  email: string;
  instagram?: string;
  address: string;
  pixKey: string;
  pixType: string;
  pixHolder: string;
  defaultValidityDays: number;
  defaultObservations: string;
  warrantyTerms: string;
  allowRegistrations?: boolean;
  adminAuthKey?: string;
};

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'JC ELETRICISTA',
  slogan: 'Instalações Residenciais & Comerciais',
  ownerName: 'Juan Carlos',
  doc: '',
  phone: '47 99706-4183',
  email: '@jc_eletricistajoinville',
  instagram: '@jc_eletricistajoinville',
  address: 'Joinville - SC',
  pixKey: '',
  pixType: 'Telefone',
  pixHolder: 'JC Eletricista',
  defaultValidityDays: 15,
  defaultObservations: '• Orçamento válido por 15 dias corridos.\n• Garantia de 90 dias sobre a mão de obra executada.\n• Materiais sob responsabilidade do cliente, salvo prévio acordo contratual.\n• Pagamento facilitado via PIX ou Cartão em até 12x.',
  warrantyTerms: 'Garantia legal de 90 dias em conformidade com o Código de Defesa do Consumidor para todos os serviços elétricos prestados.',
  allowRegistrations: true,
  adminAuthKey: 'Davi'
};

// ================= AUTHENTICATION =================
export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Save user to 'users' collection
      try {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          id: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Could not save user profile doc:', e);
      }
    }
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      return null;
    }
    console.error('Google Sign In Error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error('Email Sign In Error:', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string, name: string): Promise<User | null> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: name });
      
      try {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          id: result.user.uid,
          email: result.user.email,
          displayName: name,
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Could not save user profile doc:', e);
      }
    }
    return result.user;
  } catch (error: any) {
    console.error('Email Register Error:', error);
    throw error;
  }
};

// ================= COMPANY SETTINGS =================
export const getCompanySettings = async (): Promise<CompanySettings> => {
  try {
    const local = localStorage.getItem('@jc-eletricista:company_settings');
    let base = local ? JSON.parse(local) : DEFAULT_COMPANY_SETTINGS;
    
    // Try from firestore
    const docRef = doc(db, 'company_settings', 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as CompanySettings;
      const merged = { ...base, ...data };
      localStorage.setItem('@jc-eletricista:company_settings', JSON.stringify(merged));
      return merged;
    }
    return base;
  } catch (e) {
    console.warn('Error reading company settings from Firestore, fallback to local', e);
    const local = localStorage.getItem('@jc-eletricista:company_settings');
    return local ? JSON.parse(local) : DEFAULT_COMPANY_SETTINGS;
  }
};

export const saveCompanySettings = async (settings: CompanySettings): Promise<boolean> => {
  try {
    localStorage.setItem('@jc-eletricista:company_settings', JSON.stringify(settings));
    const docRef = doc(db, 'company_settings', 'main');
    await setDoc(docRef, settings, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving company settings to Firestore:', e);
    return false;
  }
};

// ================= QUOTES (ORÇAMENTOS) =================
export const saveQuoteToFirestore = async (quote: any): Promise<boolean> => {
  if (!quote || !quote.id) return false;
  try {
    const docRef = doc(db, 'quotes', String(quote.id));
    await setDoc(docRef, quote, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving quote to Firestore:', e);
    return false;
  }
};

export const deleteQuoteFromFirestore = async (id: string): Promise<boolean> => {
  if (!id) return false;
  try {
    const docRef = doc(db, 'quotes', String(id));
    await deleteDoc(docRef);
    return true;
  } catch (e) {
    console.error('Error deleting quote from Firestore:', e);
    return false;
  }
};

// ================= CLIENTS (CLIENTES) =================
export const saveClientToFirestore = async (client: any): Promise<boolean> => {
  if (!client || !client.id) return false;
  try {
    const docRef = doc(db, 'clients', String(client.id));
    await setDoc(docRef, client, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving client to Firestore:', e);
    return false;
  }
};

export const deleteClientFromFirestore = async (id: string): Promise<boolean> => {
  if (!id) return false;
  try {
    const docRef = doc(db, 'clients', String(id));
    await deleteDoc(docRef);
    return true;
  } catch (e) {
    console.error('Error deleting client from Firestore:', e);
    return false;
  }
};

// ================= CATALOG (CATÁLOGO) =================
export const saveCatalogItemToFirestore = async (item: any): Promise<boolean> => {
  if (!item || !item.id) return false;
  try {
    const docRef = doc(db, 'catalog', String(item.id));
    await setDoc(docRef, item, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving catalog item to Firestore:', e);
    return false;
  }
};

export const deleteCatalogItemFromFirestore = async (id: string): Promise<boolean> => {
  if (!id) return false;
  try {
    const docRef = doc(db, 'catalog', String(id));
    await deleteDoc(docRef);
    return true;
  } catch (e) {
    console.error('Error deleting catalog item from Firestore:', e);
    return false;
  }
};

// ================= SYNC ALL LOCAL TO FIRESTORE =================
export const syncAllLocalDataToFirestore = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const savedClients = localStorage.getItem('@jc-eletricista:clients');
    const clientsList = savedClients ? JSON.parse(savedClients) : [];
    for (const client of clientsList) {
      if (client.id) {
        await setDoc(doc(db, 'clients', String(client.id)), client, { merge: true });
      }
    }

    const savedQuotes = localStorage.getItem('@jc-eletricista:saved_drafts_v2');
    const quotesList = savedQuotes ? JSON.parse(savedQuotes) : [];
    for (const quote of quotesList) {
      if (quote.id) {
        await setDoc(doc(db, 'quotes', String(quote.id)), quote, { merge: true });
      }
    }

    const savedCatalog = localStorage.getItem('@jc-eletricista:catalog_items');
    const catalogList = savedCatalog ? JSON.parse(savedCatalog) : [];
    for (const item of catalogList) {
      if (item.id) {
        await setDoc(doc(db, 'catalog', String(item.id)), item, { merge: true });
      }
    }

    const savedSettings = localStorage.getItem('@jc-eletricista:company_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      await setDoc(doc(db, 'company_settings', 'main'), parsed, { merge: true });
    }

    return { 
      success: true, 
      message: `Sincronização concluída! ${clientsList.length} clientes, ${quotesList.length} orçamentos e ${catalogList.length} itens do catálogo foram salvos na nuvem Firebase.` 
    };
  } catch (error: any) {
    console.error('Sync to Firestore error:', error);
    return { success: false, message: 'Erro ao sincronizar com o Firebase: ' + (error.message || error) };
  }
};

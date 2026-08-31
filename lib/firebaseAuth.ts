import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, type User, signOut } from 'firebase/auth';
export type { User };
import { auth } from './firebase';

export { auth };
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account'
});

let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    const cachedToken = typeof window !== 'undefined' ? sessionStorage.getItem('@jc-eletricista:google_token') : null;
    
    if (user) {
      if (cachedToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      if (typeof window !== 'undefined') sessionStorage.removeItem('@jc-eletricista:google_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso da conta Google.');
    }
    
    const token = credential.accessToken;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('@jc-eletricista:google_token', token);
    }
    
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      // User closed the popup window without completing sign-in
      return null;
    }
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return typeof window !== 'undefined' ? sessionStorage.getItem('@jc-eletricista:google_token') : null;
};

export const setAccessToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('@jc-eletricista:google_token', token);
    } else {
      sessionStorage.removeItem('@jc-eletricista:google_token');
    }
  }
};

export const logout = async () => {
  await signOut(auth);
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('@jc-eletricista:google_token');
  }
};

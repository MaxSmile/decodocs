import { atom } from 'nanostores';

export type AuthStatus = 'pending' | 'authenticated' | 'unauthenticated' | 'error';

export type AuthState = {
  status: AuthStatus;
  user: any | null;
  error: Error | null;
};

const defaultAuthState: AuthState = {
  status: 'pending',
  user: null,
  error: null,
};

export const authStateStore = atom<AuthState>(defaultAuthState);
export const firebaseAppStore = atom<any | null>(null);
export const firebaseAuthStore = atom<any | null>(null);

let watcherStarted = false;
let authReadyPromise: Promise<any> | null = null;

const isProbablyPlaceholder = (value: string | undefined) => {
  if (!value || typeof value !== 'string') return true;
  const normalized = value.trim();
  return (
    normalized === '' ||
    normalized.includes('your_') ||
    normalized.includes('replace_me') ||
    normalized.includes('changeme')
  );
};

const getFirebaseConfig = () => ({
  apiKey: 'AIzaSyDqow-DLrBOZGUbGCN2nxpMCqXcbqDQe5Q',
  authDomain: 'snapsign-au.firebaseapp.com',
  projectId: 'snapsign-au',
  storageBucket: 'snapsign-au.firebasestorage.app',
  messagingSenderId: '388378898686',
  appId: '1:388378898686:web:ec9931e426c1e7e768b5af',
  measurementId: 'G-R41Q720M9W',
});

const loadFirebaseModules = async () => {
  const [firebaseAppModule, firebaseAuthModule] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ]);

  return { firebaseAppModule, firebaseAuthModule };
};

const initializeFirebaseClient = async () => {
  if (typeof window === 'undefined') {
    return { app: null, auth: null, firebaseAuthModule: null };
  }

  const existingApp = firebaseAppStore.get();
  const existingAuth = firebaseAuthStore.get();
  if (existingApp && existingAuth) {
    const { firebaseAuthModule } = await loadFirebaseModules();
    return { app: existingApp, auth: existingAuth, firebaseAuthModule };
  }

  const firebaseConfig = getFirebaseConfig();

  try {

    const { firebaseAppModule, firebaseAuthModule } = await loadFirebaseModules();
    const app = firebaseAppModule.getApps().length === 0
      ? firebaseAppModule.initializeApp(firebaseConfig)
      : firebaseAppModule.getApp();
    const auth = firebaseAuthModule.getAuth(app);

    firebaseAppStore.set(app);
    firebaseAuthStore.set(auth);

    return { app, auth, firebaseAuthModule };
  } catch (error) {
    const authError = error instanceof Error ? error : new Error('Failed to initialize Firebase Auth');
    authStateStore.set({ status: 'error', user: null, error: authError });
    return { app: null, auth: null, firebaseAuthModule: null };
  }
};

const getAuthClient = async () => {
  if (!authReadyPromise) {
    authReadyPromise = initializeFirebaseClient();
  }

  const result = await authReadyPromise;
  if (!result.auth) {
    throw new Error('Auth is not available');
  }
  return result;
};

export const startAuthWatcher = async () => {
  if (watcherStarted || typeof window === 'undefined') {
    return;
  }

  watcherStarted = true;

  if ((window as any).MOCK_AUTH) {
    const mockUser =
      (window as any).MOCK_AUTH_USER === undefined
        ? ({ uid: 'test-user', isAnonymous: true } as any)
        : ((window as any).MOCK_AUTH_USER as any | null);

    authStateStore.set({
      status: mockUser ? 'authenticated' : 'unauthenticated',
      user: mockUser,
      error: null,
    });
    return;
  }

  const { auth, firebaseAuthModule } = await getAuthClient();

  if (!auth || !firebaseAuthModule || typeof (firebaseAuthModule as any).onAuthStateChanged !== 'function') {
    authStateStore.set({
      status: 'error',
      user: null,
      error: new Error('Firebase Auth not available'),
    });
    return;
  }

  firebaseAuthModule.onAuthStateChanged(
    auth,
    async (user: any) => {
      if (!user) {
        try {
          const credential = await firebaseAuthModule.signInAnonymously(auth);
          authStateStore.set({ status: 'authenticated', user: credential.user, error: null });
        } catch (error) {
          const authError = error instanceof Error ? error : new Error('Authentication error');
          authStateStore.set({ status: 'error', user: null, error: authError });
        }
        return;
      }

      authStateStore.set({ status: 'authenticated', user, error: null });
    },
    (error: Error) => {
      authStateStore.set({ status: 'error', user: null, error });
    }
  );
};

export const authActions = {
  signInWithGoogle: async () => {
    const { auth, firebaseAuthModule } = await getAuthClient();
    await startAuthWatcher();
    return firebaseAuthModule.signInWithPopup(auth, new firebaseAuthModule.GoogleAuthProvider());
  },
  signInWithMicrosoft: async () => {
    const { auth, firebaseAuthModule } = await getAuthClient();
    await startAuthWatcher();
    return firebaseAuthModule.signInWithPopup(auth, new firebaseAuthModule.OAuthProvider('microsoft.com'));
  },
  signInWithApple: async () => {
    const { auth, firebaseAuthModule } = await getAuthClient();
    await startAuthWatcher();
    return firebaseAuthModule.signInWithPopup(auth, new firebaseAuthModule.OAuthProvider('apple.com'));
  },
  signInWithEmail: async (email: string, password: string) => {
    const { auth, firebaseAuthModule } = await getAuthClient();
    await startAuthWatcher();
    return firebaseAuthModule.signInWithEmailAndPassword(auth, email, password);
  },
  signUpWithEmail: async (email: string, password: string) => {
    const { auth, firebaseAuthModule } = await getAuthClient();
    await startAuthWatcher();
    return firebaseAuthModule.createUserWithEmailAndPassword(auth, email, password);
  },
  resetPassword: async (email: string) => {
    const { auth, firebaseAuthModule } = await getAuthClient();
    await startAuthWatcher();
    return firebaseAuthModule.sendPasswordResetEmail(auth, email);
  },
  signOutUser: async () => {
    const { auth, firebaseAuthModule } = await getAuthClient();
    await firebaseAuthModule.signOut(auth);
  },
  linkWithGoogle: async () => {
    const { auth, firebaseAuthModule } = await getAuthClient();
    const user = auth.currentUser;
    if (!user) throw new Error('No user to link');
    return firebaseAuthModule.linkWithPopup(user, new firebaseAuthModule.GoogleAuthProvider());
  },
  linkWithMicrosoft: async () => {
    const { auth, firebaseAuthModule } = await getAuthClient();
    const user = auth.currentUser;
    if (!user) throw new Error('No user to link');
    return firebaseAuthModule.linkWithPopup(user, new firebaseAuthModule.OAuthProvider('microsoft.com'));
  },
  linkWithApple: async () => {
    const { auth, firebaseAuthModule } = await getAuthClient();
    const user = auth.currentUser;
    if (!user) throw new Error('No user to link');
    return firebaseAuthModule.linkWithPopup(user, new firebaseAuthModule.OAuthProvider('apple.com'));
  },
  linkWithEmail: async (email: string, password: string) => {
    const { auth, firebaseAuthModule } = await getAuthClient();
    const user = auth.currentUser;
    if (!user) throw new Error('No user to link');
    const credential = firebaseAuthModule.EmailAuthProvider.credential(email, password);
    return firebaseAuthModule.linkWithCredential(user, credential);
  },
};

export const getAuthStateSnapshot = () => authStateStore.get();
export const getFirebaseSnapshot = () => ({ app: firebaseAppStore.get(), auth: firebaseAuthStore.get() });

// Testing hooks for pure helpers/internal flows.
export const __testables = {
  isProbablyPlaceholder,
  getFirebaseConfig,
};

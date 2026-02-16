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
let authEmulatorConnected = false;
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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDqow-DLrBOZGUbGCN2nxpMCqXcbqDQe5Q',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'snapsign-au.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'snapsign-au',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'snapsign-au.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '388378898686',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:388378898686:web:ec9931e426c1e7e768b5af',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-R41Q720M9W',
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

  let firebaseConfig = getFirebaseConfig();

  try {
    if ((window as any).MOCK_AUTH) {
      if (isProbablyPlaceholder(firebaseConfig.apiKey)) {
        firebaseConfig = {
          apiKey: 'AIzaSyDummyKeyForMockStats',
          authDomain: 'mock-project.firebaseapp.com',
          projectId: 'mock-project',
          storageBucket: 'mock-project.appspot.com',
          messagingSenderId: '123456789',
          appId: '1:123456789:web:abcdef',
          measurementId: 'G-MOCK',
        };
      }
    } else if (isProbablyPlaceholder(firebaseConfig.apiKey)) {
      throw new Error(
        'Firebase client configuration is missing or invalid. Authentication will be unavailable.'
      );
    }

    const { firebaseAppModule, firebaseAuthModule } = await loadFirebaseModules();
    const app = firebaseAppModule.getApps().length === 0
      ? firebaseAppModule.initializeApp(firebaseConfig)
      : firebaseAppModule.getApp();
    const auth = firebaseAuthModule.getAuth(app);

    const useEmulator = String(import.meta.env.VITE_USE_FIREBASE_EMULATOR || '').toLowerCase() === 'true';
    if (useEmulator && !authEmulatorConnected) {
      firebaseAuthModule.connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      authEmulatorConnected = true;
    }

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

  if (!auth || !firebaseAuthModule) {
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
};

export const getAuthStateSnapshot = () => authStateStore.get();
export const getFirebaseSnapshot = () => ({ app: firebaseAppStore.get(), auth: firebaseAuthStore.get() });

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  connectAuthEmulator,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';

/**
 * AuthContext provides auth state management with error handling
 * Auth failures are treated as soft errors - the app continues to work
 */
const AuthContext = createContext();

// Firebase configuration
// NOTE: This config is public and safe to ship to the client (it is not a secret).
// It identifies the Firebase project used by the app; security is enforced by Firebase rules.
//
// We keep a hard default so production works without any .env setup, but allow overrides for
// local experimentation via Vite env vars.
let firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDqow-DLrBOZGUbGCN2nxpMCqXcbqDQe5Q',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'snapsign-au.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'snapsign-au',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'snapsign-au.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '388378898686',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:388378898686:web:ec9931e426c1e7e768b5af',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-R41Q720M9W',
};

const isProbablyPlaceholder = (v) => {
  if (!v || typeof v !== 'string') return true;
  const s = v.trim();
  return (
    s === '' ||
    s.includes('your_') ||
    s.includes('replace_me') ||
    s.includes('changeme')
  );
};

// Initialize Firebase
let app = null;
let auth = null;
let authEmulatorConnected = false;

try {
  // Check if we are in MOCK_AUTH mode (e.g. End-to-End tests)
  if (window.MOCK_AUTH) {
     // In mock mode, if keys are missing, provide dummy values to ensure app initialization
     if (isProbablyPlaceholder(firebaseConfig.apiKey)) {
         console.log('Using dummy Firebase config for MOCK_AUTH mode');
         firebaseConfig = {
             apiKey: "AIzaSyDummyKeyForMockStats",
             authDomain: "mock-project.firebaseapp.com",
             projectId: "mock-project",
             storageBucket: "mock-project.appspot.com",
             messagingSenderId: "123456789",
             appId: "1:123456789:web:abcdef"
         };
     }
  } else if (isProbablyPlaceholder(firebaseConfig.apiKey)) {
    throw new Error(
      'Firebase client configuration is missing or invalid. Authentication will be unavailable.'
    );
  }

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);

  // Optional: local dev can run against the Firebase Auth emulator.
  // This keeps local development unblocked when you don't want to use real project keys.
  const useEmulator = String(import.meta.env.VITE_USE_FIREBASE_EMULATOR || '').toLowerCase() === 'true';
  if (useEmulator && !authEmulatorConnected) {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    authEmulatorConnected = true;
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    status: 'pending', // pending | authenticated | unauthenticated | error
    user: null,
    error: null,
  });

  useEffect(() => {
    // Test Mode Mock
    if (window.MOCK_AUTH) {
      // window.MOCK_AUTH_USER can be set to null to simulate logged-out state
      // If undefined, defaults to a valid user
      const mockUser = window.MOCK_AUTH_USER === undefined ? { uid: 'test-user', isAnonymous: true } : window.MOCK_AUTH_USER;

      setAuthState({
        status: mockUser ? 'authenticated' : 'unauthenticated',
        user: mockUser,
        error: null,
      });
      return;
    }

    if (!auth) {
      setAuthState({
        status: 'error',
        user: null,
        error: new Error('Firebase Auth not available'),
      });
      console.error('Firebase Auth not available');
      return;
    }

    // Keep authState in sync with Firebase. If there is no user session,
    // we immediately create an anonymous session (privacy-first default).
    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          try {
            const userCredential = await signInAnonymously(auth);
            setAuthState({ status: 'authenticated', user: userCredential.user, error: null });
          } catch (error) {
            console.error('Authentication error:', error);
            setAuthState({ status: 'error', user: null, error });
          }
          return;
        }

        setAuthState({ status: 'authenticated', user, error: null });
      },
      (error) => {
        console.error('Authentication observer error:', error);
        setAuthState({ status: 'error', user: null, error });
      }
    );

    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Auth is not available');
    return signInWithPopup(auth, new GoogleAuthProvider());
  };

  const signInWithMicrosoft = async () => {
    if (!auth) throw new Error('Auth is not available');
    return signInWithPopup(auth, new OAuthProvider('microsoft.com'));
  };

  const signInWithApple = async () => {
    if (!auth) throw new Error('Auth is not available');
    return signInWithPopup(auth, new OAuthProvider('apple.com'));
  };

  const signInWithEmail = async (email, password) => {
    if (!auth) throw new Error('Auth is not available');
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email, password) => {
    if (!auth) throw new Error('Auth is not available');
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = async (email) => {
    if (!auth) throw new Error('Auth is not available');
    return sendPasswordResetEmail(auth, email);
  };

  const signOutUser = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        app,
        auth,
        signInWithGoogle,
        signInWithMicrosoft,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 * Returns { authState, app, auth }
 * authState has: { status, user, error }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

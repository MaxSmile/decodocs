import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

/**
 * AuthContext provides auth state management with error handling
 * Auth failures are treated as soft errors - the app continues to work
 */
const AuthContext = createContext();

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'snapsign-au.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID || 'snapsign-au',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'snapsign-au.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
let app = null;
let auth = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    status: 'pending', // pending, authenticated, error
    user: null,
    error: null,
  });

  useEffect(() => {
    const initAuth = async () => {
      if (!auth) {
        setAuthState({
          status: 'error',
          user: null,
          error: new Error('Firebase Auth not available'),
        });
        console.error('Firebase Auth not available');
        return;
      }

      try {
        const userCredential = await signInAnonymously(auth);
        setAuthState({
          status: 'authenticated',
          user: userCredential.user,
          error: null,
        });
      } catch (error) {
        console.error('Authentication error:', error);
        // Treat auth failure as a soft error - app continues to work
        setAuthState({
          status: 'error',
          user: null,
          error,
        });
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ authState, app, auth }}>
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

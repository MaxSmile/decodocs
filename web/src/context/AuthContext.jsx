import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  authActions,
  authStateStore,
  firebaseAppStore,
  firebaseAuthStore,
  startAuthWatcher,
} from '../stores/authStore.ts';

export const AuthProvider = ({ children }) => {
  useEffect(() => {
    void startAuthWatcher();
  }, []);

  return children;
};

export const useAuth = () => {
  const authState = useStore(authStateStore);
  const app = useStore(firebaseAppStore);
  const auth = useStore(firebaseAuthStore);

  useEffect(() => {
    void startAuthWatcher();
  }, []);

  return {
    authState,
    app,
    auth,
    ...authActions,
  };
};

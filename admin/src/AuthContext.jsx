import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { auth, isSnapsignAdminEmail } from './firebase.js';

const Ctx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    status: 'pending', // pending | signed_out | signed_in | error
    user: null,
    error: null,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          setState({ status: 'signed_out', user: null, error: null });
          return;
        }
        setState({ status: 'signed_in', user, error: null });
      },
      (error) => setState({ status: 'error', user: null, error })
    );

    return () => unsub();
  }, []);

  const api = useMemo(() => {
    const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
    const logout = () => signOut(auth);
    const isAdmin = (email) => isSnapsignAdminEmail(email);

    return { signIn, register, logout, isAdmin };
  }, []);

  return <Ctx.Provider value={{ state, ...api }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
};

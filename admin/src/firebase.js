import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Admin portal uses the same Firebase project as the main app.
// Defaults are the snapsign-au web config; can be overridden via Vite env.
export const firebaseConfig = {
  apiKey: 'AIzaSyDqow-DLrBOZGUbGCN2nxpMCqXcbqDQe5Q',
  authDomain: 'snapsign-au.firebaseapp.com',
  projectId: 'snapsign-au',
  storageBucket: 'snapsign-au.firebasestorage.app',
  messagingSenderId: '388378898686',
  appId: '1:388378898686:web:ec9931e426c1e7e768b5af',
  measurementId: 'G-R41Q720M9W',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const fn = getFunctions(app);

export const isSnapsignAdminEmail = (email) =>
  typeof email === 'string' && email.toLowerCase().endsWith('@snapsign.com.au');

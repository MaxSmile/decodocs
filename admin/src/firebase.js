import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Admin portal uses the same Firebase project as the main app.
// Defaults are the snapsign-au web config; can be overridden via Vite env.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDqow-DLrBOZGUbGCN2nxpMCqXcbqDQe5Q',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'snapsign-au.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'snapsign-au',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'snapsign-au.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '388378898686',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:388378898686:web:ec9931e426c1e7e768b5af',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-R41Q720M9W',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const isSnapsignAdminEmail = (email) =>
  typeof email === 'string' && email.toLowerCase().endsWith('@snapsign.com.au');

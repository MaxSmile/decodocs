import { httpsCallable } from 'firebase/functions';

export async function analyzeTextCall({ functions, payload }) {
  if (!functions) throw new Error('Firebase functions not available');
  const fn = httpsCallable(functions, 'analyzeText');
  if (typeof fn !== 'function') throw new Error('analyzeText callable not available');
  const resp = await fn(payload);
  return resp;
}

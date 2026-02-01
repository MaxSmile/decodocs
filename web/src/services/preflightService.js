import { httpsCallable } from 'firebase/functions';

export async function preflightCheckCall({ functions, docHash, stats }) {
  if (!functions) throw new Error('Firebase functions not available');
  const fn = httpsCallable(functions, 'preflightCheck');
  if (typeof fn !== 'function') throw new Error('preflightCheck callable not available');
  const resp = await fn({ docHash, stats });
  return resp?.data;
}

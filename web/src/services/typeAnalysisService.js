import { httpsCallable } from 'firebase/functions';

/**
 * Calls the `analyzeByType` callable.
 *
 * Returns the raw `.data` payload.
 */
export async function analyzeByTypeCall({ functions, docHash, text }) {
  if (!functions) throw new Error('Firebase functions not available');
  const fn = httpsCallable(functions, 'analyzeByType');
  if (typeof fn !== 'function') throw new Error('analyzeByType callable not available');
  const resp = await fn({ docHash, text });
  return resp?.data;
}

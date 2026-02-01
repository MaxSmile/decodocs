import { httpsCallable } from 'firebase/functions';

export async function saveDocTypeOverrideCall({ functions, docHash, typeId }) {
  if (!functions) throw new Error('Firebase functions not available');
  const fn = httpsCallable(functions, 'saveDocTypeOverride');
  if (typeof fn !== 'function') return null;
  const resp = await fn({ docHash, typeId });
  return resp?.data;
}

export async function getDocumentTypeStateCall({ functions, docHash }) {
  if (!functions) throw new Error('Firebase functions not available');
  const fn = httpsCallable(functions, 'getDocumentTypeState');
  if (typeof fn !== 'function') return null;
  const resp = await fn({ docHash });
  return resp?.data;
}

export async function detectDocumentTypeCall({ functions, docHash, stats, text }) {
  if (!functions) throw new Error('Firebase functions not available');
  const fn = httpsCallable(functions, 'detectDocumentType');
  if (typeof fn !== 'function') return null;
  const resp = await fn({ docHash, stats, text });
  return resp?.data;
}

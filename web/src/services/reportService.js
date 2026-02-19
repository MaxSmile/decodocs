import { httpsCallable } from 'firebase/functions';

export const submitUserReport = async (functions, payload) => {
  const fn = httpsCallable(functions, 'submitUserReport');
  const res = await fn(payload);
  return res?.data || { ok: false };
};

export const submitClientCrash = async (functions, payload) => {
  const fn = httpsCallable(functions, 'submitClientCrash');
  const res = await fn(payload);
  return res?.data || { ok: false };
};

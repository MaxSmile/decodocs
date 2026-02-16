import { useEffect } from 'react';
import { startAuthWatcher } from '../../stores/authStore.ts';

const AuthWatcher = () => {
  useEffect(() => {
    void startAuthWatcher();
  }, []);

  return null;
};

export default AuthWatcher;

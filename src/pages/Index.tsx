import { useState, useEffect } from 'react';
import { PhoneLogin } from '@/components/auth/PhoneLogin';
import Dashboard from './Dashboard';

const AUTH_STORAGE_KEY = 'moovi-auth';

interface AuthData {
  jid: string;
  token: string;
}

const Index = () => {
  const [auth, setAuth] = useState<AuthData | null>(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [auth]);

  const handleLoginSuccess = (jid: string, token: string) => {
    setAuth({ jid, token });
  };

  const handleLogout = () => {
    setAuth(null);
  };

  if (!auth) {
    return <PhoneLogin onSuccess={handleLoginSuccess} />;
  }

  return <Dashboard jid={auth.jid} onLogout={handleLogout} />;
};

export default Index;

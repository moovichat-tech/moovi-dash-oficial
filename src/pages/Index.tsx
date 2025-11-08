import { useState, useEffect } from 'react';
import { PhoneLogin } from '@/components/auth/PhoneLogin';
import Dashboard from './Dashboard';
import Analytics from './Analytics';

const AUTH_STORAGE_KEY = 'moovi-auth';

interface AuthData {
  jid: string;
  token: string;
}

type ViewType = 'dashboard' | 'analytics';

const Index = () => {
  const [auth, setAuth] = useState<AuthData | null>(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

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
    setCurrentView('dashboard');
  };

  if (!auth) {
    return <PhoneLogin onSuccess={handleLoginSuccess} />;
  }

  if (currentView === 'analytics') {
    return (
      <Analytics 
        jid={auth.jid}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <Dashboard 
      jid={auth.jid} 
      onLogout={handleLogout}
      onNavigateToAnalytics={() => setCurrentView('analytics')}
    />
  );
};

export default Index;

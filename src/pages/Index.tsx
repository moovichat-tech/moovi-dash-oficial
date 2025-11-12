import { useState, useEffect } from 'react';
import { PhoneLogin } from '@/components/auth/PhoneLogin';
import Dashboard from './Dashboard';
import Analytics from './Analytics';

const AUTH_STORAGE_KEY = 'moovi-auth';

interface AuthData {
  jid: string;
  token: string;
  phoneNumber: string;
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

  const handleLoginSuccess = (jid: string, token: string, phoneNumber: string) => {
    setAuth({ jid, token, phoneNumber });
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
        phoneNumber={auth.phoneNumber}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <Dashboard 
      jid={auth.jid}
      phoneNumber={auth.phoneNumber}
      onLogout={handleLogout}
      onNavigateToAnalytics={() => setCurrentView('analytics')}
    />
  );
};

export default Index;

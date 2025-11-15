import { useState, useEffect } from 'react';
import { PhoneLogin } from '@/components/auth/PhoneLogin';
import Dashboard from './Dashboard';
import Analytics from './Analytics';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

type ViewType = 'dashboard' | 'analytics';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (jid: string, token: string, phoneNumber: string) => {
    // Auth is now handled by Supabase, just refresh session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('dashboard');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <PhoneLogin onSuccess={handleLoginSuccess} />;
  }

  const phoneNumber = user.user_metadata?.phone_number || '';
  const jid = user.user_metadata?.jid || '';

  if (currentView === 'analytics') {
    return (
      <Analytics 
        jid={jid}
        phoneNumber={phoneNumber}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <Dashboard 
      jid={jid}
      phoneNumber={phoneNumber}
      onLogout={handleLogout}
      onNavigateToAnalytics={() => setCurrentView('analytics')}
    />
  );
};

export default Index;

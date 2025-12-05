import { useState, useEffect } from 'react';
import { LoginPage } from '@/components/auth/LoginPage';
import { PhoneLogin } from '@/components/auth/PhoneLogin';
import { RegisterPassword } from '@/components/auth/RegisterPassword';
import Dashboard from './Dashboard';
import Analytics from './Analytics';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

type ViewType = 'dashboard' | 'analytics';
type AuthStep = 'login' | 'whatsapp' | 'register-password';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState<string>('');
  const [isResetMode, setIsResetMode] = useState(false);
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

  const handleLoginSuccess = () => {
    // Refresh session after successful login
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthStep('login');
      setPendingPhoneNumber('');
      setIsResetMode(false);
    });
  };

  const handleWhatsAppSuccess = (jid: string, token: string, phoneNumber: string, needsPasswordSetup: boolean) => {
    setPendingPhoneNumber(phoneNumber);
    
    if (needsPasswordSetup || isResetMode) {
      // Go to password registration
      setAuthStep('register-password');
    } else {
      // Already has password, go directly to dashboard
      handleLoginSuccess();
    }
  };

  const handlePasswordRegistered = () => {
    // Password created, go to dashboard
    handleLoginSuccess();
  };

  const handleFirstLogin = () => {
    setIsResetMode(false);
    setAuthStep('whatsapp');
  };

  const handleForgotPassword = () => {
    setIsResetMode(true);
    setAuthStep('whatsapp');
  };

  const handleBackToLogin = () => {
    setAuthStep('login');
    setIsResetMode(false);
    setPendingPhoneNumber('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView('dashboard');
    setAuthStep('login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="animate-pulse text-lg">Carregando...</div>
      </div>
    );
  }

  // Not authenticated - show auth flow
  if (!user) {
    if (authStep === 'whatsapp') {
      return (
        <PhoneLogin 
          onSuccess={handleWhatsAppSuccess}
          onBack={handleBackToLogin}
          isResetMode={isResetMode}
        />
      );
    }

    if (authStep === 'register-password') {
      return (
        <RegisterPassword
          phoneNumber={pendingPhoneNumber}
          onSuccess={handlePasswordRegistered}
          onBack={handleBackToLogin}
        />
      );
    }

    // Default: Login page
    return (
      <LoginPage
        onSuccess={handleLoginSuccess}
        onFirstLogin={handleFirstLogin}
        onForgotPassword={handleForgotPassword}
      />
    );
  }

  // Authenticated - show app
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

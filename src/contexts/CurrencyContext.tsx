import { createContext, useContext, ReactNode } from 'react';
import { formatCurrency as formatCurrencyUtil, getCurrencyInfo, CurrencyInfo } from '@/lib/currency';

interface CurrencyContextType {
  currency: string;
  currencyInfo: CurrencyInfo;
  formatCurrency: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'BRL',
  currencyInfo: getCurrencyInfo('BRL'),
  formatCurrency: (value) => formatCurrencyUtil(value, 'BRL'),
});

interface CurrencyProviderProps {
  currency: string;
  children: ReactNode;
}

export function CurrencyProvider({ currency, children }: CurrencyProviderProps) {
  const value: CurrencyContextType = {
    currency,
    currencyInfo: getCurrencyInfo(currency),
    formatCurrency: (val: number) => formatCurrencyUtil(val, currency),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Currency configuration and formatting utilities

export interface CurrencyInfo {
  code: string;
  symbol: string;
  locale: string;
  name: string;
}

export const CURRENCY_CONFIG: Record<string, CurrencyInfo> = {
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', name: 'Real Brasileiro' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', name: 'Dólar Americano' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'Libra Esterlina' },
  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP', name: 'Iene Japonês' },
  CNY: { code: 'CNY', symbol: '¥', locale: 'zh-CN', name: 'Yuan Chinês' },
  ARS: { code: 'ARS', symbol: '$', locale: 'es-AR', name: 'Peso Argentino' },
  MXN: { code: 'MXN', symbol: '$', locale: 'es-MX', name: 'Peso Mexicano' },
  CLP: { code: 'CLP', symbol: '$', locale: 'es-CL', name: 'Peso Chileno' },
  COP: { code: 'COP', symbol: '$', locale: 'es-CO', name: 'Peso Colombiano' },
  PEN: { code: 'PEN', symbol: 'S/', locale: 'es-PE', name: 'Sol Peruano' },
  CAD: { code: 'CAD', symbol: '$', locale: 'en-CA', name: 'Dólar Canadense' },
  AUD: { code: 'AUD', symbol: '$', locale: 'en-AU', name: 'Dólar Australiano' },
  CHF: { code: 'CHF', symbol: 'CHF', locale: 'de-CH', name: 'Franco Suíço' },
  INR: { code: 'INR', symbol: '₹', locale: 'hi-IN', name: 'Rupia Indiana' },
  KRW: { code: 'KRW', symbol: '₩', locale: 'ko-KR', name: 'Won Coreano' },
};

export function formatCurrency(value: number, currencyCode: string = 'BRL'): string {
  const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.BRL;
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
  }).format(value);
}

export function getCurrencyInfo(currencyCode: string): CurrencyInfo {
  return CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.BRL;
}

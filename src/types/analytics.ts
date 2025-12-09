import { Transaction } from './dashboard';
import { subMonths, startOfDay, endOfDay, startOfMonth } from 'date-fns';

export interface CategorySpending {
  categoria: string;
  total: number;
  quantidade: number;
  porcentagem: number;
  cor: string;
  transacoes: Transaction[];
}

export interface MonthlyComparison {
  mes: string; // "2025-01"
  mesNome: string; // "Janeiro 2025"
  receitas: number;
  despesas: number;
  saldo: number;
  categorias: CategorySpending[];
}

export interface CategoryTrend {
  categoria: string;
  historico: {
    mes: string;
    valor: number;
  }[];
}

export interface AnalyticsInsights {
  topCategoria: CategorySpending;
  maiorGasto: Transaction;
  mediaMensal: number;
  economiaMensal: number; // receita - despesa média
  categoriaCrescimento: string; // categoria com maior crescimento
}

export interface PeriodFilter {
  type: 'preset' | 'custom';
  preset?: '3m' | '6m' | '1y' | 'all';
  customFrom?: Date;
  customTo?: Date;
}

export function getPeriodDates(filter: PeriodFilter): { from: Date; to: Date } {
  const now = new Date();
  const to = filter.type === 'custom' && filter.customTo 
    ? endOfDay(filter.customTo) 
    : endOfDay(now);

  let from: Date;
  
  if (filter.type === 'custom' && filter.customFrom) {
    from = startOfDay(filter.customFrom);
  } else {
    switch (filter.preset) {
      case '3m':
        from = startOfMonth(subMonths(now, 2)); // Mês atual + 2 anteriores = 3 meses
        break;
      case '6m':
        from = startOfMonth(subMonths(now, 5)); // Mês atual + 5 anteriores = 6 meses
        break;
      case '1y':
        from = startOfMonth(subMonths(now, 11)); // Mês atual + 11 anteriores = 12 meses
        break;
      case 'all':
      default:
        from = new Date(0); // Início do tempo
        break;
    }
  }

  return { from, to };
}

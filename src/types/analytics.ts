import { Transaction } from './dashboard';
import { subMonths } from 'date-fns';

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
    ? filter.customTo 
    : now;

  let from: Date;
  
  if (filter.type === 'custom' && filter.customFrom) {
    from = filter.customFrom;
  } else {
    switch (filter.preset) {
      case '3m':
        from = subMonths(now, 3);
        break;
      case '6m':
        from = subMonths(now, 6);
        break;
      case '1y':
        from = subMonths(now, 12);
        break;
      case 'all':
      default:
        from = new Date(0); // Início do tempo
        break;
    }
  }

  return { from, to };
}

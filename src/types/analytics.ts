import { Transaction } from './dashboard';

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

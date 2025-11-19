// TypeScript interfaces para o Moovi.dash

export interface Transaction {
  id: string;
  data: string; // ISO date
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoria: string;
  conta_cartao: string;
  recorrente: boolean;
}

export interface Account {
  id: string;
  nome: string;
  tipo: 'conta_corrente' | 'poupanca' | 'cartao_credito' | 'investimento';
  saldo: number;
  limite?: number; // Para cartões de crédito
  dia_vencimento?: number; // Dia do mês (1-31) para vencimento de fatura
}

export interface Category {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  icone?: string;
  cor?: string;
}

export interface Goal {
  id: string;
  descricao: string;
  valor_total: number | null;
  valor_guardado: number;
  prazo: string | null; // ISO date
  recorrencia: 'mensal' | null;
  valor_mensal: number | null;
  categoria?: string;
}

export interface RecurringTransaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoria: string;
  frequencia: 'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'anual';
  proxima_data: string; // ISO date
  ativo: boolean;
}

export interface Budget {
  categoria: string;
  limite: number;
  gasto_atual?: number; // Opcional - será calculado no frontend
}

export interface DashboardData {
  jid: string;
  saldo_total: number;
  receita_mensal: number;
  despesa_mensal: number;
  transacoes: Transaction[];
  contas_cartoes: Account[];
  categorias: Category[];
  metas: Goal[];
  recorrencias: RecurringTransaction[];
  limites: Budget[];
  historico_30dias: {
    data: string;
    receitas: number;
    despesas: number;
  }[];
}

export interface CommandResponse {
  success: boolean;
  message?: string;
}

export interface User {
  jid: string;
  telefone: string;
  nome?: string;
}

export interface TransactionFilterState {
  search: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  categories: string[];
  tipo: 'todos' | 'receita' | 'despesa';
  valorMin: number | undefined;
  valorMax: number | undefined;
}

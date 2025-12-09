import { useMemo } from 'react';
import { DashboardData, Transaction } from '@/types/dashboard';
import { 
  CategorySpending, 
  MonthlyComparison, 
  CategoryTrend, 
  AnalyticsInsights,
  PeriodFilter,
  getPeriodDates 
} from '@/types/analytics';
import { format, isWithinInterval, eachMonthOfInterval, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Paleta de cores distintas para categorias (20+ cores únicas)
const CATEGORY_COLORS = [
  '#FF6B6B', // Vermelho coral
  '#4ECDC4', // Turquesa
  '#45B7D1', // Azul céu
  '#96CEB4', // Verde menta
  '#FFEAA7', // Amarelo pastel
  '#DDA0DD', // Ameixa
  '#98D8C8', // Verde água
  '#F7DC6F', // Amarelo dourado
  '#BB8FCE', // Roxo lavanda
  '#85C1E9', // Azul claro
  '#F8B500', // Laranja dourado
  '#00CEC9', // Ciano
  '#E17055', // Terracota
  '#74B9FF', // Azul bebê
  '#A29BFE', // Lilás
  '#FD79A8', // Rosa pink
  '#00B894', // Verde esmeralda
  '#FDCB6E', // Amarelo mostarda
  '#6C5CE7', // Roxo índigo
  '#81ECEC', // Ciano claro
  '#FAB1A0', // Salmão
  '#55A3FF', // Azul royal
  '#FF7675', // Coral claro
  '#A3CB38', // Verde limão
];

// Map para garantir cores consistentes por categoria
const categoryColorMap = new Map<string, string>();
let colorIndex = 0;

function getCategoryColor(categoria: string): string {
  // Se já tem cor atribuída, retorna ela
  if (categoryColorMap.has(categoria)) {
    return categoryColorMap.get(categoria)!;
  }
  
  // Atribui a próxima cor disponível
  const color = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
  categoryColorMap.set(categoria, color);
  colorIndex++;
  
  return color;
}

export function useAnalytics(
  data: DashboardData | null, 
  periodFilter: PeriodFilter
) {
  // Calcular range de datas baseado no filtro
  const dateRange = useMemo(() => getPeriodDates(periodFilter), [periodFilter]);

  // Filtrar transações pelo período ANTES de processar
  // ✅ Usar todas_transacoes para Analytics (histórico completo), fallback para transacoes
  const filteredTransactions = useMemo(() => {
    const allTransactions = data?.todas_transacoes ?? data?.transacoes ?? [];
    if (allTransactions.length === 0) return [];

    return allTransactions.filter(t => {
      // ✅ FIX: Usar parseISO para evitar problemas de timezone
      // parseISO trata "2025-12-09" como data LOCAL, não UTC
      const transactionDate = startOfDay(parseISO(t.data));
      return isWithinInterval(transactionDate, {
        start: dateRange.from,
        end: dateRange.to,
      });
    });
  }, [data, dateRange]);

  // Gastos por categoria (AGORA USA TRANSAÇÕES FILTRADAS)
  const categorySpending = useMemo((): CategorySpending[] => {
    const despesas = filteredTransactions.filter(t => t.valor < 0);
    const total = despesas.reduce((sum, t) => sum + Math.abs(t.valor), 0);

    if (total === 0) return [];

    const grouped = despesas.reduce((acc, t) => {
      if (!acc[t.categoria]) {
        acc[t.categoria] = {
          categoria: t.categoria,
          total: 0,
          quantidade: 0,
          porcentagem: 0,
          cor: getCategoryColor(t.categoria),
          transacoes: [],
        };
      }
      acc[t.categoria].total += Math.abs(t.valor);
      acc[t.categoria].quantidade += 1;
      acc[t.categoria].transacoes.push(t);
      return acc;
    }, {} as Record<string, CategorySpending>);

    return Object.values(grouped)
      .map(cat => ({
        ...cat,
        porcentagem: (cat.total / total) * 100,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  // Comparação mensal (DINÂMICA baseada no range)
  const monthlyComparison = useMemo((): MonthlyComparison[] => {
    if (filteredTransactions.length === 0) return [];

    // Para "Tudo", usar a data da primeira transação como início
    // Ordenar transações por data e pegar a mais antiga
    const sortedByDate = [...filteredTransactions].sort((a, b) => 
      parseISO(a.data).getTime() - parseISO(b.data).getTime()
    );
    const firstTransactionDate = parseISO(sortedByDate[0].data);
    
    // Usar a primeira transação como início se dateRange.from for muito antiga (1970)
    const effectiveStart = dateRange.from.getFullYear() < 2000 
      ? firstTransactionDate 
      : dateRange.from;

    // Gerar array de meses no range
    const monthsInRange = eachMonthOfInterval({
      start: effectiveStart,
      end: dateRange.to,
    });

    return monthsInRange.map(monthDate => {
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthName = format(monthDate, 'MMMM yyyy', { locale: ptBR });

      const monthTransactions = filteredTransactions.filter(t => {
        // ✅ Usar parseISO para consistência no parsing de datas
        const transactionMonth = format(parseISO(t.data), 'yyyy-MM');
        return transactionMonth === monthKey;
      });

      const receitas = monthTransactions
        .filter(t => t.valor >= 0)
        .reduce((sum, t) => sum + t.valor, 0);

      const despesas = monthTransactions
        .filter(t => t.valor < 0)
        .reduce((sum, t) => sum + Math.abs(t.valor), 0);

      const despesasDoMes = monthTransactions.filter(t => t.valor < 0);
      const totalDespesas = despesasDoMes.reduce((sum, t) => sum + Math.abs(t.valor), 0);
      
      const categorias = Object.values(
        despesasDoMes.reduce((acc, t) => {
          if (!acc[t.categoria]) {
            acc[t.categoria] = {
              categoria: t.categoria,
              total: 0,
              quantidade: 0,
              porcentagem: 0,
              cor: getCategoryColor(t.categoria),
              transacoes: [],
            };
          }
          acc[t.categoria].total += Math.abs(t.valor);
          acc[t.categoria].quantidade += 1;
          acc[t.categoria].transacoes.push(t);
          return acc;
        }, {} as Record<string, CategorySpending>)
      ).map(cat => ({
        ...cat,
        porcentagem: totalDespesas > 0 ? (cat.total / totalDespesas) * 100 : 0,
      }));

      return {
        mes: monthKey,
        mesNome: monthName,
        receitas,
        despesas,
        saldo: receitas - despesas,
        categorias,
      };
    });
  }, [filteredTransactions, dateRange]);

  // Tendência por categoria (top 5 categorias nos últimos 6 meses)
  const categoryTrends = useMemo((): CategoryTrend[] => {
    const top5 = categorySpending.slice(0, 5);
    
    return top5.map(cat => ({
      categoria: cat.categoria,
      historico: monthlyComparison.map(month => {
        const catInMonth = month.categorias.find(c => c.categoria === cat.categoria);
        return {
          mes: month.mesNome,
          valor: catInMonth?.total || 0,
        };
      }),
    }));
  }, [categorySpending, monthlyComparison]);

  // Insights calculados (usa dados filtrados)
  const insights = useMemo((): AnalyticsInsights | null => {
    if (categorySpending.length === 0 || filteredTransactions.length === 0) return null;

    const despesas = filteredTransactions.filter(t => t.valor < 0);
    const maiorGasto = despesas.reduce((max, t) => 
      Math.abs(t.valor) > Math.abs(max.valor) ? t : max
    , despesas[0]);

    const mediaMensal = monthlyComparison.length > 0
      ? monthlyComparison.reduce((sum, m) => sum + m.despesas, 0) / monthlyComparison.length
      : 0;

    const mediaReceita = monthlyComparison.length > 0
      ? monthlyComparison.reduce((sum, m) => sum + m.receitas, 0) / monthlyComparison.length
      : 0;

    // Categoria com maior crescimento (comparar último mês vs média)
    const ultimoMes = monthlyComparison[monthlyComparison.length - 1];
    let categoriaCrescimento = 'N/A';
    let maiorCrescimento = 0;

    if (ultimoMes && monthlyComparison.length > 1) {
      ultimoMes.categorias.forEach(cat => {
        const historico = monthlyComparison
          .slice(0, -1)
          .map(m => m.categorias.find(c => c.categoria === cat.categoria)?.total || 0);
        const media = historico.reduce((a, b) => a + b, 0) / historico.length;
        const crescimento = media > 0 ? ((cat.total - media) / media) * 100 : 0;
        
        if (crescimento > maiorCrescimento) {
          maiorCrescimento = crescimento;
          categoriaCrescimento = cat.categoria;
        }
      });
    }

    return {
      topCategoria: categorySpending[0],
      maiorGasto,
      mediaMensal,
      economiaMensal: mediaReceita - mediaMensal,
      categoriaCrescimento,
    };
  }, [categorySpending, monthlyComparison, filteredTransactions]);

  return {
    categorySpending,
    monthlyComparison,
    categoryTrends,
    insights,
    filteredTransactions,
  };
}

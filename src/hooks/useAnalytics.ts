import { useMemo } from 'react';
import { DashboardData, Transaction } from '@/types/dashboard';
import { CategorySpending, MonthlyComparison, CategoryTrend, AnalyticsInsights } from '@/types/analytics';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper para cores consistentes
function getCategoryColor(categoria: string): string {
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];
  
  const hash = categoria.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function useAnalytics(data: DashboardData | null) {
  // Gastos por categoria (apenas despesas)
  const categorySpending = useMemo((): CategorySpending[] => {
    if (!data?.transacoes) return [];

    const despesas = data.transacoes.filter(t => t.tipo === 'despesa');
    const total = despesas.reduce((sum, t) => sum + t.valor, 0);

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
      acc[t.categoria].total += t.valor;
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
  }, [data]);

  // Comparação mensal (últimos 6 meses)
  const monthlyComparison = useMemo((): MonthlyComparison[] => {
    if (!data?.transacoes) return [];

    const months: MonthlyComparison[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(startOfMonth(new Date()), i);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthName = format(monthDate, 'MMMM yyyy', { locale: ptBR });

      const monthTransactions = data.transacoes.filter(t => 
        t.data.startsWith(monthKey)
      );

      const receitas = monthTransactions
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valor, 0);

      const despesas = monthTransactions
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);

      const despesasDoMes = monthTransactions.filter(t => t.tipo === 'despesa');
      const totalDespesas = despesasDoMes.reduce((sum, t) => sum + t.valor, 0);
      
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
          acc[t.categoria].total += t.valor;
          acc[t.categoria].quantidade += 1;
          acc[t.categoria].transacoes.push(t);
          return acc;
        }, {} as Record<string, CategorySpending>)
      ).map(cat => ({
        ...cat,
        porcentagem: totalDespesas > 0 ? (cat.total / totalDespesas) * 100 : 0,
      }));

      months.push({
        mes: monthKey,
        mesNome: monthName,
        receitas,
        despesas,
        saldo: receitas - despesas,
        categorias,
      });
    }

    return months;
  }, [data]);

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

  // Insights calculados
  const insights = useMemo((): AnalyticsInsights | null => {
    if (!data || categorySpending.length === 0) return null;

    const despesas = data.transacoes.filter(t => t.tipo === 'despesa');
    const maiorGasto = despesas.reduce((max, t) => 
      t.valor > max.valor ? t : max
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
  }, [data, categorySpending, monthlyComparison]);

  return {
    categorySpending,
    monthlyComparison,
    categoryTrends,
    insights,
  };
}

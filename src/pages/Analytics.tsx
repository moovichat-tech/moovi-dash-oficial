import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAnalytics } from '@/hooks/useAnalytics';
import { CategoryPieChart } from '@/components/analytics/CategoryPieChart';
import { MonthlyComparison } from '@/components/analytics/MonthlyComparison';
import { CategoryTrendChart } from '@/components/analytics/CategoryTrendChart';
import { InsightCards } from '@/components/analytics/InsightCards';
import { PeriodFilterBar } from '@/components/analytics/PeriodFilterBar';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodFilter } from '@/types/analytics';

interface AnalyticsProps {
  jid: string;
  onBack: () => void;
}

export default function Analytics({ jid, onBack }: AnalyticsProps) {
  const { data, loading } = useDashboard(jid);
  
  // Estado do filtro de período (default: últimos 6 meses)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({
    type: 'preset',
    preset: '6m',
  });
  
  const { categorySpending, monthlyComparison, categoryTrends, insights } = 
    useAnalytics(data, periodFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="text-center mt-8">
          <p className="text-muted-foreground">Dados insuficientes para análise</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">Análise detalhada dos seus gastos</p>
            </div>
          </div>
        </div>

        {/* Filtros de Período */}
        <PeriodFilterBar 
          filter={periodFilter} 
          onFilterChange={setPeriodFilter} 
        />

        {/* Insights Cards */}
        {insights && <InsightCards insights={insights} />}

        {/* Empty State quando não há dados no período */}
        {!insights && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma transação encontrada no período selecionado
            </p>
          </div>
        )}

        {/* Gráficos (só mostrar se houver insights) */}
        {insights && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <CategoryPieChart data={categorySpending} />
              <MonthlyComparison data={monthlyComparison} />
            </div>

            <CategoryTrendChart trends={categoryTrends} />
          </>
        )}
      </div>
    </div>
  );
}

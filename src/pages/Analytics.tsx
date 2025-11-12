import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileDown } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useChartExport } from '@/hooks/useChartExport';
import { CategoryPieChart } from '@/components/analytics/CategoryPieChart';
import { MonthlyComparison } from '@/components/analytics/MonthlyComparison';
import { CategoryTrendChart } from '@/components/analytics/CategoryTrendChart';
import { InsightCards } from '@/components/analytics/InsightCards';
import { PeriodFilterBar } from '@/components/analytics/PeriodFilterBar';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodFilter } from '@/types/analytics';

interface AnalyticsProps {
  jid: string;
  phoneNumber: string;
  onBack: () => void;
}

export default function Analytics({ jid, phoneNumber, onBack }: AnalyticsProps) {
  const { data, loading } = useDashboard(jid, phoneNumber);
  const { exportMultipleToPDF } = useChartExport();
  
  // Estado do filtro de período (default: últimos 6 meses)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({
    type: 'preset',
    preset: '6m',
  });
  
  const { categorySpending, monthlyComparison, categoryTrends, insights } = 
    useAnalytics(data, periodFilter);

  // Refs para todos os gráficos
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);

  // Função para exportar todos os gráficos
  const handleExportAll = () => {
    const elements = [
      { ref: insightsRef, title: 'Insights Principais' },
      { ref: pieChartRef, title: 'Gastos por Categoria' },
      { ref: barChartRef, title: 'Comparação Mensal' },
      { ref: lineChartRef, title: 'Tendência por Categoria' },
    ];

    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim();

    exportMultipleToPDF(elements, 'analytics-completo', bgColor ? `hsl(${bgColor})` : '#ffffff');
  };

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
          {insights && (
            <Button onClick={handleExportAll} variant="default">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar Tudo (PDF)
            </Button>
          )}
        </div>

        {/* Filtros de Período */}
        <PeriodFilterBar 
          filter={periodFilter} 
          onFilterChange={setPeriodFilter} 
        />

        {/* Insights Cards */}
        {insights && (
          <div ref={insightsRef}>
            <InsightCards insights={insights} />
          </div>
        )}

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
              <div ref={pieChartRef}>
                <CategoryPieChart data={categorySpending} />
              </div>
              <div ref={barChartRef}>
                <MonthlyComparison data={monthlyComparison} />
              </div>
            </div>

            <div ref={lineChartRef}>
              <CategoryTrendChart trends={categoryTrends} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

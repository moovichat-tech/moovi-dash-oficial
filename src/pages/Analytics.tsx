import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAnalytics } from '@/hooks/useAnalytics';
import { CategoryPieChart } from '@/components/analytics/CategoryPieChart';
import { MonthlyComparison } from '@/components/analytics/MonthlyComparison';
import { CategoryTrendChart } from '@/components/analytics/CategoryTrendChart';
import { InsightCards } from '@/components/analytics/InsightCards';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsProps {
  jid: string;
  onBack: () => void;
}

export default function Analytics({ jid, onBack }: AnalyticsProps) {
  const { data, loading } = useDashboard(jid);
  const { categorySpending, monthlyComparison, categoryTrends, insights } = useAnalytics(data);

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

  if (!data || !insights) {
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

        <InsightCards insights={insights} />

        <div className="grid gap-6 md:grid-cols-2">
          <CategoryPieChart data={categorySpending} />
          <MonthlyComparison data={monthlyComparison} />
        </div>

        <CategoryTrendChart trends={categoryTrends} />
      </div>
    </div>
  );
}

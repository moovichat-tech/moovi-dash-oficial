import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsInsights } from '@/types/analytics';
import { TrendingUp, TrendingDown, Award, CreditCard, PiggyBank } from 'lucide-react';

interface InsightCardsProps {
  insights: AnalyticsInsights;
}

export function InsightCards({ insights }: InsightCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Categoria</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{insights.topCategoria.categoria}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(insights.topCategoria.total)} ({insights.topCategoria.porcentagem.toFixed(1)}%)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Maior Gasto</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(insights.maiorGasto.valor)}</div>
          <p className="text-xs text-muted-foreground truncate">
            {insights.maiorGasto.descricao}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média Mensal</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(insights.mediaMensal)}</div>
          <p className="text-xs text-muted-foreground">
            Despesas médias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Economia Mensal</CardTitle>
          {insights.economiaMensal >= 0 ? (
            <PiggyBank className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${insights.economiaMensal >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(Math.abs(insights.economiaMensal))}
          </div>
          <p className="text-xs text-muted-foreground">
            {insights.economiaMensal >= 0 ? 'Poupando' : 'Gastando mais'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

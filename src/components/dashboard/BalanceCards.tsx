import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface BalanceCardsProps {
  saldoTotal: number;
  receitaMensal: number;
  despesaMensal: number;
}

export function BalanceCards({ saldoTotal, receitaMensal, despesaMensal }: BalanceCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const balance = receitaMensal - despesaMensal;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo Total
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(saldoTotal)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {balance >= 0 ? 'Balanço positivo' : 'Balanço negativo'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receitas do Mês
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(receitaMensal)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Entradas no período
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Despesas do Mês
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(despesaMensal)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Saídas no período
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

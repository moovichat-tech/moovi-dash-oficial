import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Budget } from '@/types/dashboard';

interface LimitCardProps {
  budget: Budget;
}

export function LimitCard({ budget }: LimitCardProps) {
  const usagePercent = Math.min(100, (budget.gasto_atual / budget.limite) * 100);

  const statusColor =
    usagePercent >= 100
      ? 'text-destructive'
      : usagePercent >= 80
      ? 'text-warning'
      : 'text-success';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium truncate">{budget.categoria}</CardTitle>
          <span className={`text-sm font-semibold flex-shrink-0 ${statusColor}`}>
            {usagePercent.toFixed(0)}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={usagePercent} className="h-2" />

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {formatCurrency(budget.gasto_atual)} de {formatCurrency(budget.limite)}
          </span>
          <span className={statusColor}>
            {formatCurrency(Math.max(0, budget.limite - budget.gasto_atual))} restante
          </span>
        </div>

        {usagePercent >= 100 && (
          <Badge variant="destructive" className="text-xs w-full justify-center">
            ⚠ Limite excedido!
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

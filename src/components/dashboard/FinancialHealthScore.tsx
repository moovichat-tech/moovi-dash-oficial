import { Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFinancialHealth } from '@/hooks/useFinancialHealth';

interface FinancialHealthScoreProps {
  receitaMensal: number;
  despesaMensal: number;
}

export function FinancialHealthScore({
  receitaMensal,
  despesaMensal,
}: FinancialHealthScoreProps) {
  const health = useFinancialHealth(receitaMensal, despesaMensal);

  return (
    <Card className={`border-2 ${health.bgColor}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Saúde Financeira {health.emoji}</CardTitle>
            </div>
            <CardDescription className="mt-1.5">
              {health.message}
            </CardDescription>
          </div>
          <div className={`text-5xl font-bold ${health.color}`}>
            {health.score}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={health.score} className="h-3" />
        
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
          <div className="p-2 rounded-md bg-destructive/10 text-destructive">
            0-39 Crítico
          </div>
          <div className="p-2 rounded-md bg-warning/10 text-warning">
            40-69 Atenção
          </div>
          <div className="p-2 rounded-md bg-success/10 text-success">
            70-100 Saudável
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

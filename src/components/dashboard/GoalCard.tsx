import { Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Goal } from '@/types/dashboard';
import { differenceInDays } from 'date-fns';

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const progress = Math.min(100, (goal.valor_atual / goal.valor_alvo) * 100);
  const daysRemaining = differenceInDays(new Date(goal.data_alvo), new Date());

  const status =
    progress >= 100 ? 'completed' : daysRemaining < 0 ? 'delayed' : 'in_progress';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 flex-shrink-0 text-primary" />
              <span className="truncate">{goal.nome}</span>
            </CardTitle>
            <CardDescription className="mt-1">
              {formatCurrency(goal.valor_atual)} de {formatCurrency(goal.valor_alvo)}
            </CardDescription>
          </div>
          <Badge
            variant={
              status === 'completed'
                ? 'default'
                : status === 'delayed'
                ? 'destructive'
                : 'secondary'
            }
            className="flex-shrink-0"
          >
            {status === 'completed'
              ? '✓ Concluída'
              : status === 'delayed'
              ? '⚠ Atrasada'
              : '→ Em andamento'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progresso */}
        <div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">
            {progress.toFixed(1)}% alcançado
          </p>
        </div>

        {/* Categoria */}
        {goal.categoria && (
          <Badge variant="outline" className="font-normal">
            {goal.categoria}
          </Badge>
        )}

        {/* Prazo */}
        <p className="text-xs text-muted-foreground">
          {daysRemaining > 0
            ? `${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
            : daysRemaining === 0
            ? 'Vence hoje'
            : `Atrasada há ${Math.abs(daysRemaining)} dia${Math.abs(daysRemaining) !== 1 ? 's' : ''}`}
        </p>
      </CardContent>
    </Card>
  );
}

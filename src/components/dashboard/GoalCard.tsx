import { Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Goal } from '@/types/dashboard';
import { differenceInDays } from 'date-fns';
import { cardVariants, hoverScale } from '@/lib/animations';

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const isRecurringGoal = goal.recorrencia === 'mensal';
  
  const progress = isRecurringGoal
    ? Math.min(100, (goal.valor_guardado / (goal.valor_mensal || 1)) * 100)
    : Math.min(100, (goal.valor_guardado / (goal.valor_total || 1)) * 100);
  
  const daysRemaining = !isRecurringGoal && goal.prazo 
    ? differenceInDays(new Date(goal.prazo), new Date())
    : null;

  const status = isRecurringGoal 
    ? 'recurring'
    : progress >= 100 
      ? 'completed' 
      : (daysRemaining !== null && daysRemaining < 0) 
        ? 'delayed' 
        : 'in_progress';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isNearCompletion = progress >= 80 && progress < 100;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={hoverScale}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base flex items-center gap-2">
                <motion.div
                  animate={isNearCompletion ? {
                    scale: [1, 1.2, 1],
                  } : {}}
                  transition={{
                    repeat: isNearCompletion ? Infinity : 0,
                    duration: 2,
                  }}
                >
                  <Target className="h-4 w-4 flex-shrink-0 text-primary" />
                </motion.div>
                <span className="truncate">{goal.descricao}</span>
              </CardTitle>
              <CardDescription className="mt-1">
                {isRecurringGoal ? (
                  <>
                    {formatCurrency(goal.valor_guardado)} de {formatCurrency(goal.valor_mensal || 0)} (mensal)
                  </>
                ) : (
                  <>
                    {formatCurrency(goal.valor_guardado)} de {formatCurrency(goal.valor_total || 0)}
                  </>
                )}
              </CardDescription>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge
                variant={
                  status === 'completed'
                    ? 'default'
                    : status === 'delayed'
                    ? 'destructive'
                    : status === 'recurring'
                    ? 'outline'
                    : 'secondary'
                }
                className="flex-shrink-0"
              >
                {status === 'completed'
                  ? '✓ Concluída'
                  : status === 'delayed'
                  ? '⚠ Atrasada'
                  : status === 'recurring'
                  ? '🔄 Recorrente'
                  : '→ Em andamento'}
              </Badge>
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">
              {progress.toFixed(1)}% alcançado
            </p>
          </motion.div>

          {goal.categoria && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Badge variant="outline" className="font-normal">
                {goal.categoria}
              </Badge>
            </motion.div>
          )}

          {!isRecurringGoal && daysRemaining !== null && (
            <motion.p 
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {daysRemaining > 0
                ? `${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
                : daysRemaining === 0
                ? 'Vence hoje'
                : `Atrasada há ${Math.abs(daysRemaining)} dia${Math.abs(daysRemaining) !== 1 ? 's' : ''}`}
            </motion.p>
          )}

          {isRecurringGoal && (
            <motion.p 
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Meta mensal • Renova automaticamente
            </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

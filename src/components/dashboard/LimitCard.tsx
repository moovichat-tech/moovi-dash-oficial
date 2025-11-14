import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Budget } from '@/types/dashboard';
import { cardVariants, hoverScale } from '@/lib/animations';

interface LimitCardProps {
  budget: Budget;
}

export function LimitCard({ budget }: LimitCardProps) {
  const usagePercent = budget.limite > 0 
    ? Math.min(100, ((budget.gasto_atual || 0) / budget.limite) * 100)
    : 0;

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

  const isExceeded = usagePercent >= 100;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={hoverScale}
      className="h-full"
    >
      <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium truncate">{budget.categoria}</CardTitle>
          <motion.span 
            className={`text-sm font-semibold flex-shrink-0 ${statusColor}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: 'spring',
              stiffness: 200,
              damping: 10,
              delay: 0.2 
            }}
          >
            {usagePercent.toFixed(0)}%
          </motion.span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Progress value={usagePercent} className="h-2" />
        </motion.div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {formatCurrency(budget.gasto_atual)} de {formatCurrency(budget.limite)}
          </span>
          <span className={statusColor}>
            {formatCurrency(Math.max(0, budget.limite - budget.gasto_atual))} restante
          </span>
        </div>

        {isExceeded && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: [1, 1.05, 1],
            }}
            transition={{
              opacity: { duration: 0.3, delay: 0.4 },
              scale: {
                repeat: Infinity,
                duration: 2,
                delay: 0.5,
              }
            }}
          >
            <Badge variant="destructive" className="text-xs w-full justify-center">
              ⚠ Limite excedido!
            </Badge>
          </motion.div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}

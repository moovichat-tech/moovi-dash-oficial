import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Budget } from '@/types/dashboard';
import { cardVariants, hoverScale } from '@/lib/animations';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencyTextName } from '@/lib/currency';

interface LimitCardProps {
  budget: Budget;
  onEditLimit?: (command: string) => void;
}

export function LimitCard({ budget, onEditLimit }: LimitCardProps) {
  const { formatCurrency, currency } = useCurrency();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const usagePercent = budget.limite > 0 
    ? Math.min(100, ((budget.gasto_atual || 0) / budget.limite) * 100)
    : 0;

  const statusColor =
    usagePercent >= 100
      ? 'text-destructive'
      : usagePercent >= 80
      ? 'text-warning'
      : 'text-success';

  const isExceeded = usagePercent >= 100;

  const handleStartEdit = () => {
    setEditValue(budget.limite.toString());
    setIsEditing(true);
  };

  const handleConfirmEdit = () => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue) && newValue !== budget.limite && onEditLimit) {
      const moedaNome = getCurrencyTextName(currency);
      const command = `alterar limite da categoria ${budget.categoria} de ${budget.limite} ${moedaNome} para ${newValue} ${moedaNome}`;
      onEditLimit(command);
    }
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue('');
    }
  };

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
            {formatCurrency(budget.gasto_atual)} de{' '}
            {isEditing ? (
              <span className="inline-flex items-center gap-1">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleConfirmEdit}
                  className="h-5 w-20 text-xs px-1"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={handleConfirmEdit}
                >
                  <Check className="h-3 w-3 text-success" />
                </Button>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                {formatCurrency(budget.limite)}
                {onEditLimit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={handleStartEdit}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                  </Button>
                )}
              </span>
            )}
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
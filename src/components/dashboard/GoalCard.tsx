import { useState } from 'react';
import { Target, Pencil, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Goal } from '@/types/dashboard';
import { differenceInDays } from 'date-fns';
import { cardVariants, hoverScale } from '@/lib/animations';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencyTextName } from '@/lib/currency';
import { removeEmojis } from '@/lib/utils';
import { useCommandFeedback } from '@/hooks/useCommandFeedback';

interface GoalCardProps {
  goal: Goal;
  onEditGoal?: (command: string) => void;
}

type EditField = 'valor_guardado' | 'valor_total' | 'valor_mensal' | null;

export function GoalCard({ goal, onEditGoal }: GoalCardProps) {
  const { formatCurrency, currency } = useCurrency();
  const { showFeedback } = useCommandFeedback();
  const [editingField, setEditingField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState('');

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

  const isNearCompletion = progress >= 80 && progress < 100;

  const handleStartEdit = (field: EditField) => {
    if (!field) return;
    let currentValue = 0;
    if (field === 'valor_guardado') currentValue = goal.valor_guardado;
    else if (field === 'valor_total') currentValue = goal.valor_total || 0;
    else if (field === 'valor_mensal') currentValue = goal.valor_mensal || 0;
    
    setEditValue(currentValue.toString());
    setEditingField(field);
  };

  const handleConfirmEdit = () => {
    if (!editingField || !onEditGoal) return;
    
    const newValue = parseFloat(editValue);
    if (isNaN(newValue)) {
      setEditingField(null);
      setEditValue('');
      return;
    }

    let currentValue = 0;
    let fieldLabel = '';
    
    if (editingField === 'valor_guardado') {
      currentValue = goal.valor_guardado;
      fieldLabel = 'valor guardado';
    } else if (editingField === 'valor_total') {
      currentValue = goal.valor_total || 0;
      fieldLabel = 'valor total';
    } else if (editingField === 'valor_mensal') {
      currentValue = goal.valor_mensal || 0;
      fieldLabel = 'valor mensal';
    }

    if (newValue !== currentValue) {
      const moedaNome = getCurrencyTextName(currency);
      const command = `alterar meta ID ${goal.id} '${removeEmojis(goal.descricao)}' - ${fieldLabel} de ${currentValue} ${moedaNome} para ${newValue} ${moedaNome}`;
      showFeedback('edit', '✏️ Editando meta...');
      onEditGoal(command);
    }
    
    setEditingField(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setEditValue('');
    }
  };

  const renderEditableValue = (field: EditField, value: number, suffix?: string) => {
    if (editingField === field) {
      return (
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
          {suffix}
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1">
        {formatCurrency(value)}
        {onEditGoal && (
          <Button
            size="icon"
            variant="ghost"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => handleStartEdit(field)}
          >
            <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
          </Button>
        )}
        {suffix}
      </span>
    );
  };

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
                    {renderEditableValue('valor_guardado', goal.valor_guardado)} de {renderEditableValue('valor_mensal', goal.valor_mensal || 0, ' (mensal)')}
                  </>
                ) : (
                  <>
                    {renderEditableValue('valor_guardado', goal.valor_guardado)} de {renderEditableValue('valor_total', goal.valor_total || 0)}
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
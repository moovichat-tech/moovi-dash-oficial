import { useState } from 'react';
import { CreditCard, Wallet, PiggyBank, TrendingUp, AlertTriangle, Calendar, Pencil, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Account } from '@/types/dashboard';
import { cardVariants, hoverScale } from '@/lib/animations';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencyTextName } from '@/lib/currency';
import { removeEmojis } from '@/lib/utils';
import { useCommandFeedback } from '@/hooks/useCommandFeedback';

interface AccountCardProps {
  account: Account;
  onEditAccount?: (command: string) => void;
}

type EditField = 'saldo' | 'limite' | null;

export function AccountCard({ account, onEditAccount }: AccountCardProps) {
  const { formatCurrency, currency } = useCurrency();
  const { showFeedback } = useCommandFeedback();
  const [editingField, setEditingField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState('');

  const usagePercent = account.limite ? (Math.abs(account.saldo) / account.limite) * 100 : 0;

  const statusColor =
    usagePercent >= 90 ? 'text-destructive' : usagePercent >= 70 ? 'text-warning' : 'text-success';

  const getIcon = () => {
    switch (account.tipo) {
      case 'cartao_credito':
        return CreditCard;
      case 'conta_corrente':
        return Wallet;
      case 'poupanca':
        return PiggyBank;
      case 'investimento':
        return TrendingUp;
      default:
        return Wallet;
    }
  };

  const Icon = getIcon();

  const getTipoLabel = (tipo: Account['tipo']) => {
    const labels = {
      cartao_credito: 'Cartão de Crédito',
      conta_corrente: 'Conta Corrente',
      poupanca: 'Poupança',
      investimento: 'Investimento',
    };
    return labels[tipo];
  };

  const isCritical = usagePercent >= 90;

  const getDaysUntilDue = (dueDay: number): number => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let dueDate = new Date(currentYear, currentMonth, dueDay);
    
    if (currentDay > dueDay) {
      dueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getDueDateColor = (dueDay: number): string => {
    const daysUntil = getDaysUntilDue(dueDay);
    if (daysUntil <= 2) return 'text-destructive';
    if (daysUntil <= 5) return 'text-warning';
    return 'text-muted-foreground';
  };

  const handleStartEdit = (field: EditField) => {
    if (!field) return;
    let currentValue = 0;
    if (field === 'saldo') currentValue = account.saldo;
    else if (field === 'limite') currentValue = account.limite || 0;
    
    setEditValue(currentValue.toString());
    setEditingField(field);
  };

  const handleConfirmEdit = () => {
    if (!editingField || !onEditAccount) return;
    
    const newValue = parseFloat(editValue);
    if (isNaN(newValue)) {
      setEditingField(null);
      setEditValue('');
      return;
    }

    const moedaNome = getCurrencyTextName(currency);
    let command = '';

    if (editingField === 'saldo') {
      if (newValue !== account.saldo) {
        command = `alterar saldo da conta ID ${account.id} '${removeEmojis(account.nome)}' de ${account.saldo} ${moedaNome} para ${newValue} ${moedaNome}`;
      }
    } else if (editingField === 'limite') {
      const currentLimite = account.limite || 0;
      if (newValue !== currentLimite) {
        if (account.tipo === 'cartao_credito') {
          command = `alterar limite do cartão ID ${account.id} '${removeEmojis(account.nome)}' de ${currentLimite} ${moedaNome} para ${newValue} ${moedaNome}`;
        } else {
          command = `alterar limite da conta ID ${account.id} '${removeEmojis(account.nome)}' de ${currentLimite} ${moedaNome} para ${newValue} ${moedaNome}`;
        }
      }
    }

    if (command) {
      const label = editingField === 'limite' ? 'limite' : 'saldo';
      showFeedback('edit', `✏️ Editando ${label}...`);
      onEditAccount(command);
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

  const renderEditableValue = (field: EditField, value: number) => {
    if (editingField === field) {
      return (
        <span className="inline-flex items-center gap-1">
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleConfirmEdit}
            className="h-6 w-24 text-sm px-1"
            autoFocus
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleConfirmEdit}
          >
            <Check className="h-3.5 w-3.5 text-success" />
          </Button>
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1">
        {formatCurrency(value)}
        {onEditAccount && (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 p-0 hover:bg-transparent"
            onClick={() => handleStartEdit(field)}
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
          </Button>
        )}
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
        <div className="flex items-start gap-3">
          <motion.div 
            className="p-2 rounded-lg bg-primary/10"
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
          >
            <Icon className="h-5 w-5 text-primary" />
          </motion.div>
          
          <motion.div 
            className="flex-1 min-w-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-base truncate">{account.nome}</CardTitle>
            <CardDescription className="mt-0.5">{getTipoLabel(account.tipo)}</CardDescription>
          </motion.div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-2xl font-bold">{formatCurrency(account.saldo)}</p>
          <p className="text-xs text-muted-foreground">Saldo atual</p>
        </motion.div>

        {account.limite && (
          <>
            <Separator />
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Limite disponível</span>
                <span className={`font-semibold ${statusColor}`}>
                  {formatCurrency(account.limite - Math.abs(account.saldo))}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Limite total</span>
                {renderEditableValue('limite', account.limite)}
              </div>

              <Progress value={Math.min(usagePercent, 100)} className="h-2" />

              <p className="text-xs text-muted-foreground">{usagePercent.toFixed(1)}% utilizado</p>
            </motion.div>
          </>
        )}

        {account.dia_vencimento && account.tipo === 'cartao_credito' && (
          <>
            <Separator />
            <motion.div
              className="flex items-center gap-2 text-sm"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <span className="text-muted-foreground">Vence dia </span>
                <span className={`font-semibold ${getDueDateColor(account.dia_vencimento)}`}>
                  {account.dia_vencimento}
                </span>
                {getDaysUntilDue(account.dia_vencimento) <= 5 && (
                  <span className={`ml-1 text-xs ${getDueDateColor(account.dia_vencimento)}`}>
                    ({getDaysUntilDue(account.dia_vencimento)} dias)
                  </span>
                )}
              </div>
            </motion.div>
          </>
        )}

        {account.limite && isCritical && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: [1, 1.02, 1],
            }}
            transition={{
              opacity: { duration: 0.3 },
              scale: {
                repeat: Infinity,
                duration: 2,
              }
            }}
          >
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Atenção! Você está próximo do limite.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}
import { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Account, Budget } from '@/types/dashboard';
import { AccountCard } from './AccountCard';
import { LimitCard } from './LimitCard';
import { NewAccountModal } from './NewAccountModal';
import { useCountUp } from '@/hooks/useCountUp';
import { containerVariants, fadeInVariants, tapScale } from '@/lib/animations';

interface AccountsPanelProps {
  accounts: Account[];
  budgets: Budget[];
  onSendCommand: (command: string) => Promise<void>;
}

export function AccountsPanel({ accounts, budgets, onSendCommand }: AccountsPanelProps) {
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const safeAccounts = accounts || [];
  const totalBalance = safeAccounts.reduce((sum, a) => sum + a.saldo, 0);
  const totalLimits = safeAccounts
    .filter((a) => a.limite)
    .reduce((sum, a) => sum + (a.limite || 0), 0);
  const totalUsed = safeAccounts
    .filter((a) => a.limite)
    .reduce((sum, a) => sum + Math.abs(a.saldo), 0);
  const globalUsage = totalLimits > 0 ? (totalUsed / totalLimits) * 100 : 0;

  const animatedBalance = useCountUp(totalBalance, 1500);
  const animatedLimits = useCountUp(totalLimits, 1500);
  const animatedUsage = useCountUp(globalUsage, 1500);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Contas e Limites</CardTitle>
          <CardDescription>Visão geral de todas as suas contas</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <p className="text-sm text-muted-foreground">Total em contas</p>
              <p className="text-2xl font-bold">
                {formatCurrency(animatedBalance)}
              </p>
            </motion.div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <p className="text-sm text-muted-foreground">Limites totais</p>
              <p className="text-2xl font-bold">{formatCurrency(animatedLimits)}</p>
            </motion.div>
            
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <p className="text-sm text-muted-foreground">Uso médio de limites</p>
              <p className="text-2xl font-bold">{animatedUsage.toFixed(1)}%</p>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Contas e Cartões</h3>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={tapScale}
          >
            <Button size="sm" variant="outline" onClick={() => setShowNewAccountModal(true)}>
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Adicionar Conta</span>
            </Button>
          </motion.div>
        </div>
        
        {safeAccounts.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
            >
              <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            </motion.div>
            <p className="text-muted-foreground">Nenhuma conta cadastrada</p>
          </motion.div>
        ) : (
          <motion.div 
            className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {safeAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </motion.div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Limites por Categoria</h3>
        <motion.div 
          className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {(budgets || []).map((budget) => (
            <LimitCard key={budget.categoria} budget={budget} />
          ))}
        </motion.div>
      </div>

      <NewAccountModal
        open={showNewAccountModal}
        onClose={() => setShowNewAccountModal(false)}
        onSendCommand={onSendCommand}
      />
    </motion.div>
  );
}

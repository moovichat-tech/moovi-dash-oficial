import { Wallet, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Account, Budget } from '@/types/dashboard';
import { AccountCard } from './AccountCard';
import { LimitCard } from './LimitCard';

interface AccountsPanelProps {
  accounts: Account[];
  budgets: Budget[];
}

export function AccountsPanel({ accounts, budgets }: AccountsPanelProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalLimits = accounts
    .filter((a) => a.limite)
    .reduce((sum, a) => sum + (a.limite || 0), 0);

  const totalUsed = accounts
    .filter((a) => a.limite)
    .reduce((sum, a) => sum + Math.abs(a.saldo), 0);

  const globalUsage = totalLimits > 0 ? (totalUsed / totalLimits) * 100 : 0;

  const totalBalance = accounts.reduce((sum, a) => sum + a.saldo, 0);

  return (
    <div className="space-y-6">
      {/* Resumo Global */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Resumo de Contas e Limites</CardTitle>
              <CardDescription className="mt-1">Visão geral de todas as suas contas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total em contas</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Limites totais</p>
              <p className="text-2xl font-bold">{formatCurrency(totalLimits)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Uso médio de limites</p>
              <p className="text-2xl font-bold">{globalUsage.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contas e Cartões */}
      {accounts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Contas e Cartões</h3>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Conta
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>
      )}

      {/* Limites por Categoria */}
      {budgets.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Limites por Categoria</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <LimitCard key={budget.categoria} budget={budget} />
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {accounts.length === 0 && budgets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">Nenhuma conta ou limite cadastrado ainda</p>
            <Button variant="link" className="text-primary">
              Comece adicionando suas contas →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

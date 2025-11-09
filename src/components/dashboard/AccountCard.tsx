import { CreditCard, Wallet, PiggyBank, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Account } from '@/types/dashboard';

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTipoLabel = (tipo: Account['tipo']) => {
    const labels = {
      cartao_credito: 'Cartão de Crédito',
      conta_corrente: 'Conta Corrente',
      poupanca: 'Poupança',
      investimento: 'Investimento',
    };
    return labels[tipo];
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{account.nome}</CardTitle>
            <CardDescription className="mt-0.5">{getTipoLabel(account.tipo)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Saldo */}
        <div>
          <p className="text-2xl font-bold">{formatCurrency(account.saldo)}</p>
          <p className="text-xs text-muted-foreground">Saldo atual</p>
        </div>

        {/* Limite (apenas para cartões) */}
        {account.limite && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Limite disponível</span>
                <span className={`font-semibold ${statusColor}`}>
                  {formatCurrency(account.limite - Math.abs(account.saldo))}
                </span>
              </div>

              <Progress value={Math.min(usagePercent, 100)} className="h-2" />

              <p className="text-xs text-muted-foreground">{usagePercent.toFixed(1)}% utilizado</p>

              {usagePercent >= 90 && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Atenção! Você está próximo do limite.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

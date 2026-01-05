import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Info } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface BalanceCardsProps {
  saldoTotal: number;
  receitaMensal: number;
  despesaMensal: number;
}

export function BalanceCards({ saldoTotal, receitaMensal, despesaMensal }: BalanceCardsProps) {
  const { formatCurrency } = useCurrency();

  const balance = receitaMensal - despesaMensal;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Total
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-sm" side="top">
                <div className="space-y-2">
                  <p className="font-semibold">Como é calculado?</p>
                  <p className="text-muted-foreground">
                    O <strong>Saldo Total</strong> é a soma de todos os saldos das suas contas bancárias, carteiras e investimentos cadastrados.
                  </p>
                  <p className="text-muted-foreground">
                    Inclui o saldo inicial de cada conta mais todas as movimentações (receitas e despesas) registradas.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(saldoTotal)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {balance >= 0 ? 'Balanço positivo' : 'Balanço negativo'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas do Mês
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-sm" side="top">
                <div className="space-y-2">
                  <p className="font-semibold">Como é calculado?</p>
                  <p className="text-muted-foreground">
                    <strong>Receitas do Mês</strong> é a soma de todas as entradas de dinheiro (salário, vendas, rendimentos, etc.) registradas no mês atual.
                  </p>
                  <p className="text-muted-foreground">
                    Considera apenas transações do tipo "receita" do período selecionado.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(receitaMensal)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Entradas no período
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do Mês
            </CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-sm" side="top">
                <div className="space-y-2">
                  <p className="font-semibold">Como é calculado?</p>
                  <p className="text-muted-foreground">
                    <strong>Despesas do Mês</strong> é a soma de todas as saídas de dinheiro (compras, contas, pagamentos, etc.) registradas no mês atual.
                  </p>
                  <p className="text-muted-foreground">
                    Considera apenas transações do tipo "despesa" do período selecionado.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(despesaMensal)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Saídas no período
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Transaction } from '@/types/dashboard';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TransactionReportTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function TransactionReportTable({ transactions, isLoading }: TransactionReportTableProps) {
  const { formatCurrency } = useCurrency();

  const formatDate = (dateString: string) => {
    const dateWithTime = dateString.includes('T') ? dateString : `${dateString}T12:00:00`;
    return format(new Date(dateWithTime), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Ordenar por data decrescente
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-md bg-muted/20">
        <p className="text-sm">Nenhuma transação encontrada neste período.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-auto rounded-md border border-border">
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-muted border-b-2 border-border hover:bg-muted">
            <TableHead className="w-[90px] font-semibold text-foreground py-2 px-3 border-r border-border/40">Data</TableHead>
            <TableHead className="font-semibold text-foreground py-2 px-3 border-r border-border/40">Descrição</TableHead>
            <TableHead className="w-[140px] font-semibold text-foreground py-2 px-3 border-r border-border/40">Categoria</TableHead>
            <TableHead className="w-[120px] font-semibold text-foreground py-2 px-3 border-r border-border/40">Conta</TableHead>
            <TableHead className="w-[80px] font-semibold text-foreground py-2 px-3 border-r border-border/40">Status</TableHead>
            <TableHead className="w-[110px] font-semibold text-foreground py-2 px-3 text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTransactions.map((transaction, index) => {
            const isExpense = transaction.valor < 0;
            
            return (
              <TableRow 
                key={transaction.id || index} 
                className="hover:bg-muted/30 border-b border-border/30"
              >
                <TableCell className="py-1.5 px-3 font-mono text-xs border-r border-border/20">
                  {formatDate(transaction.data)}
                </TableCell>
                <TableCell 
                  className="py-1.5 px-3 max-w-[280px] truncate text-sm border-r border-border/20" 
                  title={transaction.descricao || '-'}
                >
                  {transaction.descricao || '-'}
                </TableCell>
                <TableCell className="py-1.5 px-3 border-r border-border/20">
                  <span className="text-xs truncate block max-w-[130px]" title={transaction.categoria || '-'}>
                    {transaction.categoria || '-'}
                  </span>
                </TableCell>
                <TableCell className="py-1.5 px-3 text-xs text-muted-foreground border-r border-border/20 truncate max-w-[110px]" title={transaction.conta_cartao || '-'}>
                  {transaction.conta_cartao || '-'}
                </TableCell>
                <TableCell className="py-1.5 px-3 border-r border-border/20">
                  <Badge 
                    variant={isExpense ? "destructive" : "default"}
                    className={cn(
                      "text-[10px] px-1.5 py-0 font-medium",
                      !isExpense && "bg-green-600 hover:bg-green-700 text-white"
                    )}
                  >
                    {isExpense ? 'Despesa' : 'Receita'}
                  </Badge>
                </TableCell>
                <TableCell 
                  className={cn(
                    "py-1.5 px-3 text-right font-medium tabular-nums text-sm",
                    isExpense ? "text-destructive" : "text-green-600"
                  )}
                >
                  {formatCurrency(transaction.valor)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

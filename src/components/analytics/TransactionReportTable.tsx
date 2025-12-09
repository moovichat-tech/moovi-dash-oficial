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

interface TransactionReportTableProps {
  transactions: Transaction[];
}

export function TransactionReportTable({ transactions }: TransactionReportTableProps) {
  const { formatCurrency } = useCurrency();

  const formatDate = (dateString: string) => {
    const dateWithTime = dateString.includes('T') ? dateString : `${dateString}T12:00:00`;
    return format(new Date(dateWithTime), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Ordenar por data decrescente
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>Nenhuma transação encontrada no período selecionado</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[100px]">Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-[140px]">Categoria</TableHead>
            <TableHead className="w-[140px]">Conta</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[120px] text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTransactions.map((transaction, index) => {
            const isExpense = transaction.valor < 0;
            
            return (
              <TableRow key={transaction.id || index} className="hover:bg-muted/30">
                <TableCell className="py-2 font-mono text-sm">
                  {formatDate(transaction.data)}
                </TableCell>
                <TableCell className="py-2 max-w-[300px] truncate" title={transaction.descricao}>
                  {transaction.descricao || '-'}
                </TableCell>
                <TableCell className="py-2">
                  <Badge variant="outline" className="font-normal">
                    {transaction.categoria || '-'}
                  </Badge>
                </TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground">
                  {transaction.conta_cartao || '-'}
                </TableCell>
                <TableCell className="py-2">
                  <Badge 
                    variant={isExpense ? "destructive" : "default"}
                    className={cn(
                      "font-normal",
                      !isExpense && "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    {isExpense ? 'Despesa' : 'Receita'}
                  </Badge>
                </TableCell>
                <TableCell 
                  className={cn(
                    "py-2 text-right font-medium tabular-nums",
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

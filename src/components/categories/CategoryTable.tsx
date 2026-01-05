import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Category, Transaction } from '@/types/dashboard';

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'nome' | 'valor';

interface CategoryTableProps {
  categories: Category[];
  transactions: Transaction[];
  tipo: 'receita' | 'despesa';
  onDelete: (categoryName: string) => void;
}

export function CategoryTable({ categories, transactions, tipo, onDelete }: CategoryTableProps) {
  const { formatCurrency } = useCurrency();
  const [sortField, setSortField] = useState<SortField>('valor');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Calcular valor total por categoria
  const getCategoryValue = (categoryName: string) => {
    return transactions
      .filter(t => t.categoria === categoryName && t.tipo === tipo)
      .reduce((sum, t) => sum + Math.abs(t.valor), 0);
  };

  // Filtrar categorias pelo tipo
  const filteredCategories = categories.filter(c => c.tipo === tipo);

  // Ordenar categorias
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    if (sortField === 'nome') {
      const comparison = a.nome.localeCompare(b.nome, 'pt-BR');
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    if (sortField === 'valor') {
      const valueA = getCategoryValue(a.nome);
      const valueB = getCategoryValue(b.nome);
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Ciclar: asc -> desc -> null -> asc
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField('valor');
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection(field === 'nome' ? 'asc' : 'desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field || !sortDirection) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4" /> 
      : <ChevronDown className="h-4 w-4" />;
  };

  if (filteredCategories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma categoria de {tipo === 'despesa' ? 'gasto' : 'receita'} cadastrada
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleSort('nome')}
            >
              <div className="flex items-center gap-1">
                Nome
                {getSortIcon('nome')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
              onClick={() => handleSort('valor')}
            >
              <div className="flex items-center justify-end gap-1">
                {tipo === 'despesa' ? 'Valor Gasto' : 'Valor Recebido'}
                {getSortIcon('valor')}
              </div>
            </TableHead>
            <TableHead className="w-[80px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCategories.map((category) => {
            const value = getCategoryValue(category.nome);
            return (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {category.cor && (
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.cor }}
                      />
                    )}
                    {category.nome}
                  </div>
                </TableCell>
                <TableCell className={`text-right font-mono ${tipo === 'despesa' ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {tipo === 'despesa' ? '-' : '+'}{formatCurrency(value)}
                </TableCell>
                <TableCell className="text-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a categoria "{category.nome}"? 
                          As transações associadas não serão excluídas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => onDelete(category.nome)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

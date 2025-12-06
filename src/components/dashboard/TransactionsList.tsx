import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Transaction, TransactionFilterState } from '@/types/dashboard';
import { Search, TrendingUp, TrendingDown, Pencil, Check } from 'lucide-react';
import { TransactionFilters } from './TransactionFilters';
import { TransactionFilterBadges } from './TransactionFilterBadges';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';

interface TransactionsListProps {
  transactions: Transaction[];
  onEditTransaction?: (command: string) => void;
}

const getCurrencyTextName = (code: string): string => {
  const names: Record<string, string> = {
    BRL: 'reais',
    USD: 'dólares',
    EUR: 'euros',
    GBP: 'libras',
    JPY: 'ienes',
    CNY: 'yuanes',
    ARS: 'pesos',
    MXN: 'pesos',
    CLP: 'pesos',
    COP: 'pesos',
    PEN: 'soles',
    CAD: 'dólares',
    AUD: 'dólares',
    CHF: 'francos',
    INR: 'rupias',
    KRW: 'wones',
  };
  return names[code] || code;
};

export function TransactionsList({ transactions, onEditTransaction }: TransactionsListProps) {
  const { formatCurrency, currency } = useCurrency();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [filterState, setFilterState] = useState<TransactionFilterState>({
    search: '',
    dateFrom: undefined,
    dateTo: undefined,
    categories: [],
    tipo: 'todos',
    valorMin: undefined,
    valorMax: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const itemsPerPage = 10;

  // Extrair categorias únicas
  const uniqueCategories = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return Array.from(new Set(transactions.map((t) => t.categoria))).sort();
  }, [transactions]);

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return transactions
      .filter((t) => {
        // Filtro de busca textual
        const matchesSearch =
          (t.descricao || '').toLowerCase().includes(filterState.search.toLowerCase()) ||
          (t.categoria || '').toLowerCase().includes(filterState.search.toLowerCase());

        // Filtro de data
        const transactionDate = new Date(t.data);
        const matchesDateFrom =
          !filterState.dateFrom || transactionDate >= filterState.dateFrom;
        const matchesDateTo =
          !filterState.dateTo || transactionDate <= filterState.dateTo;

        // Filtro de categoria
        const matchesCategory =
          filterState.categories.length === 0 ||
          filterState.categories.includes(t.categoria);

        // Filtro de tipo
        const matchesTipo =
          filterState.tipo === 'todos' || t.tipo === filterState.tipo;

        // Filtro de valor
        const matchesValorMin =
          filterState.valorMin === undefined || t.valor >= filterState.valorMin;
        const matchesValorMax =
          filterState.valorMax === undefined || t.valor <= filterState.valorMax;

        return (
          matchesSearch &&
          matchesDateFrom &&
          matchesDateTo &&
          matchesCategory &&
          matchesTipo &&
          matchesValorMin &&
          matchesValorMax
        );
      })
      .sort((a, b) => {
        // 1. Ordenar por data decrescente (mais recente primeiro)
        const dateA = new Date(a.data).getTime();
        const dateB = new Date(b.data).getTime();
        
        if (dateB !== dateA) {
          return dateB - dateA;
        }
        
        // 2. Dentro do mesmo dia, ordenar por ID decrescente (maior ID = mais recente)
        const idA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
        const idB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
        return idB - idA;
      });
  }, [transactions, filterState]);

  // Paginação
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterState.dateFrom || filterState.dateTo) count++;
    if (filterState.categories.length > 0) count++;
    if (filterState.tipo !== 'todos') count++;
    if (filterState.valorMin !== undefined || filterState.valorMax !== undefined)
      count++;
    return count;
  }, [filterState]);

  const handleRemoveFilter = (filterKey: keyof TransactionFilterState) => {
    if (filterKey === 'dateFrom' || filterKey === 'dateTo') {
      setFilterState({ ...filterState, dateFrom: undefined, dateTo: undefined });
    } else if (filterKey === 'valorMin' || filterKey === 'valorMax') {
      setFilterState({ ...filterState, valorMin: undefined, valorMax: undefined });
    } else if (filterKey === 'categories') {
      setFilterState({ ...filterState, categories: [] });
    } else if (filterKey === 'tipo') {
      setFilterState({ ...filterState, tipo: 'todos' });
    }
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: TransactionFilterState) => {
    setFilterState(newFilters);
    setCurrentPage(1);
  };

  // Gerar páginas para paginação
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateForCommand = (dateString: string) => {
    // Adiciona hora do meio-dia para evitar problemas de timezone
    const dateWithTime = dateString.includes('T') ? dateString : `${dateString}T12:00:00`;
    return new Date(dateWithTime).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const sanitizeForCommand = (text: string): string => {
    return text
      .replace(/[/@&"`+\\]/g, '') // Remove caracteres problemáticos
      .replace(/[^\w\s\$\.,!?\-áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇàèìòùÀÈÌÒÙüÜñÑ#:()']/g, '') // Remove outros não permitidos
      .trim();
  };

  const generateEditCommand = (transaction: Transaction, newValue: number) => {
    // Usar o sinal do valor para determinar o tipo (igual a UI faz)
    const tipoTexto = transaction.valor < 0 ? 'gasto' : 'receita';
    const valorOriginal = Math.abs(transaction.valor);
    const moedaNome = getCurrencyTextName(currency);
    const transactionId = transaction.id;
    
    // Comando simplificado: ID é único, não precisa de descrição/data
    return `alterar valor do ${tipoTexto} ID ${transactionId} de ${valorOriginal} ${moedaNome} para ${newValue} ${moedaNome}`;
  };

  const handleStartEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditValue(Math.abs(transaction.valor).toString());
  };

  const handleConfirmEdit = (transaction: Transaction) => {
    const newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue <= 0) {
      toast({ title: 'Valor inválido', variant: 'destructive' });
      setEditingId(null);
      setEditValue('');
      return;
    }
    
    const command = generateEditCommand(transaction, newValue);
    onEditTransaction?.(command);
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas Transações</CardTitle>
        <div className="space-y-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              value={filterState.search}
              onChange={(e) =>
                handleFilterChange({ ...filterState, search: e.target.value })
              }
              className="pl-10"
            />
          </div>

          <TransactionFilters
            filterState={filterState}
            onFilterChange={handleFilterChange}
            categories={uniqueCategories}
            activeFiltersCount={activeFiltersCount}
          />

          <TransactionFilterBadges
            filterState={filterState}
            onRemoveFilter={handleRemoveFilter}
          />

          <div className="text-sm text-muted-foreground">
            Mostrando {paginatedTransactions.length} de {filteredTransactions.length}{' '}
            transações
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // MOBILE: Cards verticais
          <div className="space-y-3">
            {paginatedTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma transação encontrada
              </p>
            ) : (
              paginatedTransactions.map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-3 space-y-2">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {transaction.valor >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-success flex-shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{transaction.descricao}</span>
                    </div>
                    {editingId === transaction.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmEdit(transaction);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          onBlur={() => handleConfirmEdit(transaction)}
                          className="w-20 h-7 text-right text-sm"
                          autoFocus
                        />
                        <Check 
                          className="h-4 w-4 cursor-pointer text-success hover:text-success/80 flex-shrink-0" 
                          onClick={() => handleConfirmEdit(transaction)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-semibold whitespace-nowrap ${
                            transaction.valor >= 0 ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {transaction.valor > 0 ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.valor))}
                        </span>
                        {onEditTransaction && (
                          <Pencil 
                            className="h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-primary flex-shrink-0" 
                            onClick={() => handleStartEdit(transaction)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Footer do Card */}
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className="text-xs">
                      {transaction.categoria}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(transaction.data)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // DESKTOP: Tabela tradicional
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(transaction.data)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.valor >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          )}
                          <span className="font-medium">{transaction.descricao}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.categoria}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === transaction.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmEdit(transaction);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              onBlur={() => handleConfirmEdit(transaction)}
                              className="w-24 h-8 text-right"
                              autoFocus
                            />
                            <Check 
                              className="h-4 w-4 cursor-pointer text-success hover:text-success/80" 
                              onClick={() => handleConfirmEdit(transaction)}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className={
                                transaction.valor >= 0
                                  ? 'text-success font-semibold'
                                  : 'text-destructive font-semibold'
                              }
                            >
                              {transaction.valor > 0 ? '+' : '-'}
                              {formatCurrency(Math.abs(transaction.valor))}
                            </span>
                            {onEditTransaction && (
                              <Pencil 
                                className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary" 
                                onClick={() => handleStartEdit(transaction)}
                              />
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent className="flex-wrap gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className={
                      currentPage === 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>

                {getPageNumbers().map((page, index) =>
                  page === '...' ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page as number)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

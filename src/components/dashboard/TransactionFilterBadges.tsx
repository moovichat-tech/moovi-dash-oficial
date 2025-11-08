import { Badge } from '@/components/ui/badge';
import { TransactionFilterState } from '@/types/dashboard';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransactionFilterBadgesProps {
  filterState: TransactionFilterState;
  onRemoveFilter: (filterKey: keyof TransactionFilterState) => void;
}

export function TransactionFilterBadges({
  filterState,
  onRemoveFilter,
}: TransactionFilterBadgesProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const badges = [];

  // Badge de Data
  if (filterState.dateFrom || filterState.dateTo) {
    const dateText = [];
    if (filterState.dateFrom) {
      dateText.push(format(filterState.dateFrom, 'dd/MM/yyyy', { locale: ptBR }));
    }
    if (filterState.dateTo) {
      dateText.push(format(filterState.dateTo, 'dd/MM/yyyy', { locale: ptBR }));
    }
    badges.push({
      key: 'date',
      label: `Data: ${dateText.join(' - ')}`,
      onRemove: () => {
        onRemoveFilter('dateFrom');
        onRemoveFilter('dateTo');
      },
    });
  }

  // Badge de Categorias
  if (filterState.categories.length > 0) {
    badges.push({
      key: 'categories',
      label: `Categorias: ${filterState.categories.join(', ')}`,
      onRemove: () => onRemoveFilter('categories'),
    });
  }

  // Badge de Tipo
  if (filterState.tipo !== 'todos') {
    badges.push({
      key: 'tipo',
      label: `Tipo: ${filterState.tipo === 'receita' ? 'Receita' : 'Despesa'}`,
      onRemove: () => onRemoveFilter('tipo'),
    });
  }

  // Badge de Valor
  if (filterState.valorMin !== undefined || filterState.valorMax !== undefined) {
    const valorText = [];
    if (filterState.valorMin !== undefined) {
      valorText.push(`Min: ${formatCurrency(filterState.valorMin)}`);
    }
    if (filterState.valorMax !== undefined) {
      valorText.push(`Max: ${formatCurrency(filterState.valorMax)}`);
    }
    badges.push({
      key: 'valor',
      label: `Valor: ${valorText.join(' | ')}`,
      onRemove: () => {
        onRemoveFilter('valorMin');
        onRemoveFilter('valorMax');
      },
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Badge
          key={badge.key}
          variant="secondary"
          className="gap-1 pr-1"
        >
          <span className="text-xs">{badge.label}</span>
          <button
            onClick={badge.onRemove}
            className="rounded-sm hover:bg-accent hover:text-accent-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

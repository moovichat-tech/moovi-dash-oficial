import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TransactionFilterState } from '@/types/dashboard';
import { CalendarIcon, Filter, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TransactionFiltersProps {
  filterState: TransactionFilterState;
  onFilterChange: (filters: TransactionFilterState) => void;
  categories: string[];
  activeFiltersCount: number;
}

export function TransactionFilters({
  filterState,
  onFilterChange,
  categories,
  activeFiltersCount,
}: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(filterState.categories);

  const handleCategoryToggle = (category: string) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updated);
  };

  const handleApplyFilters = () => {
    onFilterChange({
      ...filterState,
      categories: selectedCategories,
    });
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    onFilterChange({
      search: '',
      dateFrom: undefined,
      dateTo: undefined,
      categories: [],
      tipo: 'todos',
      valorMin: undefined,
      valorMax: undefined,
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          size="sm"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4">
        <div className="grid gap-4 rounded-lg border bg-card p-4">
          {/* Período */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">📅 Período</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !filterState.dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterState.dateFrom ? (
                      format(filterState.dateFrom, 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      <span>Data inicial</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterState.dateFrom}
                    onSelect={(date) =>
                      onFilterChange({ ...filterState, dateFrom: date })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !filterState.dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterState.dateTo ? (
                      format(filterState.dateTo, 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      <span>Data final</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterState.dateTo}
                    onSelect={(date) =>
                      onFilterChange({ ...filterState, dateTo: date })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Categorias */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">🏷️ Categorias</Label>
            <div className="max-h-32 overflow-y-auto rounded-md border p-2 space-y-1">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhuma categoria disponível
                </p>
              ) : (
                categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-accent rounded px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">💰 Tipo</Label>
            <RadioGroup
              value={filterState.tipo}
              onValueChange={(value) =>
                onFilterChange({
                  ...filterState,
                  tipo: value as 'todos' | 'receita' | 'despesa',
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="todos" id="tipo-todos" />
                <Label htmlFor="tipo-todos" className="font-normal cursor-pointer">
                  Todos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="receita" id="tipo-receita" />
                <Label htmlFor="tipo-receita" className="font-normal cursor-pointer">
                  Receita
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="despesa" id="tipo-despesa" />
                <Label htmlFor="tipo-despesa" className="font-normal cursor-pointer">
                  Despesa
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">💵 Valor (R$)</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="valor-min" className="text-xs text-muted-foreground">
                  Mínimo
                </Label>
                <Input
                  id="valor-min"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={filterState.valorMin ?? ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...filterState,
                      valorMin: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="valor-max" className="text-xs text-muted-foreground">
                  Máximo
                </Label>
                <Input
                  id="valor-max"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="999999,99"
                  value={filterState.valorMax ?? ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...filterState,
                      valorMax: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="flex-1"
              size="sm"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar Tudo
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1"
              size="sm"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

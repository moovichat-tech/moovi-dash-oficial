import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PeriodFilter } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface PeriodFilterBarProps {
  filter: PeriodFilter;
  onFilterChange: (filter: PeriodFilter) => void;
}

export function PeriodFilterBar({ filter, onFilterChange }: PeriodFilterBarProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(filter.customFrom);
  const [dateTo, setDateTo] = useState<Date | undefined>(filter.customTo);

  const presets = [
    { id: '3m', label: 'Últimos 3 meses' },
    { id: '6m', label: 'Últimos 6 meses' },
    { id: '1y', label: 'Último ano' },
    { id: 'all', label: 'Tudo' },
  ] as const;

  const handlePresetClick = (preset: '3m' | '6m' | '1y' | 'all') => {
    onFilterChange({ type: 'preset', preset });
  };

  const handleCustomApply = () => {
    if (dateFrom && dateTo) {
      onFilterChange({
        type: 'custom',
        customFrom: dateFrom,
        customTo: dateTo,
      });
    }
  };

  const isPresetActive = (preset: string) => {
    return filter.type === 'preset' && filter.preset === preset;
  };

  const formatDate = (date: Date | undefined) => {
    return date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione';
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Filtros Preset */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4" />
              Período de Análise
            </Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant={isPresetActive(preset.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetClick(preset.id)}
                  className="transition-all"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Período Customizado */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium mb-3 block">
              Ou escolha um período customizado
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Data Inicial */}
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-2 block">De</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDate(dateFrom)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Final */}
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-2 block">Até</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDate(dateTo)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      disabled={(date) => dateFrom ? date < dateFrom : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Botão Aplicar */}
              <div className="flex items-end">
                <Button
                  onClick={handleCustomApply}
                  disabled={!dateFrom || !dateTo}
                  variant={filter.type === 'custom' ? 'default' : 'secondary'}
                  className="w-full sm:w-auto"
                >
                  Aplicar
                </Button>
              </div>
            </div>

            {/* Indicador de Filtro Ativo */}
            {filter.type === 'custom' && filter.customFrom && filter.customTo && (
              <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                Período: {formatDate(filter.customFrom)} até {formatDate(filter.customTo)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

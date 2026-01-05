import { useState, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySpending } from '@/types/analytics';
import { DrillDownModal } from './DrillDownModal';
import { ChartExportButtons } from './ChartExportButtons';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CategoryPieChartProps {
  data: CategorySpending[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { formatCurrency } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState<CategorySpending | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const chartData = data.map(cat => ({
    name: cat.categoria,
    value: cat.total,
    color: cat.cor,
    percentage: cat.porcentagem,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const category = data.find(c => c.categoria === payload[0].name);
      return (
        <div className="rounded-lg border bg-background p-2 shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value)} ({category?.porcentagem.toFixed(1)}%)
          </p>
          <p className="text-xs text-muted-foreground">
            {category?.quantidade} transações
          </p>
        </div>
      );
    }
    return null;
  };

  const handleClick = (entry: any) => {
    const category = data.find(c => c.categoria === entry.name);
    if (category) {
      setSelectedCategory(category);
    }
  };

  const handleLegendClick = (categoryName: string) => {
    const category = data.find(c => c.categoria === categoryName);
    if (category) {
      setSelectedCategory(category);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gastos por Categoria</CardTitle>
              <CardDescription>Clique em uma fatia para ver detalhes</CardDescription>
            </div>
            <ChartExportButtons 
              chartRef={chartRef} 
              filename="gastos-por-categoria"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div ref={chartRef} className="flex flex-col gap-4">
            {/* Gráfico de Pizza */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => 
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={handleClick}
                    className="cursor-pointer outline-none focus:outline-none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda customizada com scroll */}
            <div className="border-t pt-4">
              <ScrollArea className="h-[120px] w-full">
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
                  {chartData.map((entry, index) => (
                    <button
                      key={`legend-${index}`}
                      onClick={() => handleLegendClick(entry.name)}
                      className="flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity cursor-pointer"
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground whitespace-nowrap">
                        {entry.name}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCategory && (
        <DrillDownModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </>
  );
}

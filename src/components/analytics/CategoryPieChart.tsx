import { useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySpending } from '@/types/analytics';
import { DrillDownModal } from './DrillDownModal';
import { ChartExportButtons } from './ChartExportButtons';

interface CategoryPieChartProps {
  data: CategorySpending[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategorySpending | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const chartData = data.map(cat => ({
    name: cat.categoria,
    value: cat.total,
    color: cat.cor,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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
          <div ref={chartRef} className="h-[400px]">
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
                  outerRadius={120}
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
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
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

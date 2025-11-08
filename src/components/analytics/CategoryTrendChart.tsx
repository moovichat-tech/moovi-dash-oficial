import { useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryTrend } from '@/types/analytics';
import { ChartExportButtons } from './ChartExportButtons';

interface CategoryTrendChartProps {
  trends: CategoryTrend[];
}

export function CategoryTrendChart({ trends }: CategoryTrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  const chartData = trends[0]?.historico.map((_, index) => {
    const point: any = {
      mes: trends[0].historico[index].mes.split(' ')[0].substring(0, 3),
    };
    
    trends.forEach(trend => {
      point[trend.categoria] = trend.historico[index].valor;
    });
    
    return point;
  }) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tendência por Categoria</CardTitle>
            <CardDescription>Top 5 categorias ao longo do tempo</CardDescription>
          </div>
          <ChartExportButtons 
            chartRef={chartRef} 
            filename="tendencia-categorias"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis tickFormatter={formatCurrency} className="text-xs" />
              <Tooltip 
                formatter={formatCurrency}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              {trends.map((trend, index) => (
                <Line
                  key={trend.categoria}
                  type="monotone"
                  dataKey={trend.categoria}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

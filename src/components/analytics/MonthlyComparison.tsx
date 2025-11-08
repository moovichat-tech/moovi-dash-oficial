import { useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyComparison as MonthlyData } from '@/types/analytics';
import { ChartExportButtons } from './ChartExportButtons';

interface MonthlyComparisonProps {
  data: MonthlyData[];
}

export function MonthlyComparison({ data }: MonthlyComparisonProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  const chartData = data.map(month => ({
    mes: month.mesNome.split(' ')[0].substring(0, 3),
    Receitas: month.receitas,
    Despesas: month.despesas,
    Saldo: month.saldo,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Comparação Mensal</CardTitle>
            <CardDescription>Receitas vs Despesas</CardDescription>
          </div>
          <ChartExportButtons 
            chartRef={chartRef} 
            filename="comparacao-mensal"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="mes" 
                className="text-xs"
              />
              <YAxis 
                tickFormatter={formatCurrency}
                className="text-xs"
              />
              <Tooltip 
                formatter={formatCurrency}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar 
                dataKey="Receitas" 
                fill="hsl(var(--success))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="Despesas" 
                fill="hsl(var(--destructive))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

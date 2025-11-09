import { useMemo } from 'react';

export interface FinancialHealthData {
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export function useFinancialHealth(
  receitaMensal: number,
  despesaMensal: number
): FinancialHealthData {
  return useMemo(() => {
    // Cálculo do score baseado na relação receita/despesa
    let score = 0;
    
    if (receitaMensal > 0) {
      const ratio = (receitaMensal - despesaMensal) / receitaMensal;
      score = Math.max(0, Math.min(100, ratio * 100));
    }
    
    // Determinar status e mensagem
    let status: FinancialHealthData['status'];
    let message: string;
    let emoji: string;
    let color: string;
    let bgColor: string;
    
    if (score >= 70) {
      status = 'healthy';
      message = 'Você manteve excelente equilíbrio este mês! Continue assim 💪';
      emoji = '💚';
      color = 'text-success';
      bgColor = 'border-success/50 bg-success/5';
    } else if (score >= 40) {
      status = 'warning';
      message = 'Atenção! Suas despesas estão aumentando. Revise seus gastos 📊';
      emoji = '⚠️';
      color = 'text-warning';
      bgColor = 'border-warning/50 bg-warning/5';
    } else {
      status = 'critical';
      message = 'Alerta crítico! Suas despesas ultrapassam suas receitas 📉';
      emoji = '🔴';
      color = 'text-destructive';
      bgColor = 'border-destructive/50 bg-destructive/5';
    }
    
    return {
      score: Math.round(score),
      status,
      message,
      emoji,
      color,
      bgColor,
    };
  }, [receitaMensal, despesaMensal]);
}

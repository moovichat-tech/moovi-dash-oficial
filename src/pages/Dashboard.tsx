import { Moon, Sun, LogOut, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useDashboard } from '@/hooks/useDashboard';
import { BalanceCards } from '@/components/dashboard/BalanceCards';
import { TransactionsList } from '@/components/dashboard/TransactionsList';
import { FinancialChart } from '@/components/dashboard/FinancialChart';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { NotFoundState } from '@/components/dashboard/NotFoundState';
import { Skeleton } from '@/components/ui/skeleton';
import { FinancialHealthScore } from '@/components/dashboard/FinancialHealthScore';
import { GoalsPanel } from '@/components/dashboard/GoalsPanel';
import { AccountsPanel } from '@/components/dashboard/AccountsPanel';
import mooviLogo from '@/assets/moovi-logo.png';

interface DashboardProps {
  jid: string;
  onLogout: () => void;
  onNavigateToAnalytics?: () => void;
}

export default function Dashboard({ jid, onLogout, onNavigateToAnalytics }: DashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const { data, loading, isNotFound, refresh, sendCommand } = useDashboard(jid);

  if (isNotFound) {
    return <NotFoundState />;
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={mooviLogo} alt="Moovi" className="h-8" />
            <h1 className="text-xl font-bold hidden sm:block">Moovi.dash</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {onNavigateToAnalytics && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToAnalytics}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-24">
        {data && (
          <>
            <FinancialHealthScore
              receitaMensal={data.receita_mensal}
              despesaMensal={data.despesa_mensal}
            />

            <BalanceCards
              saldoTotal={data.saldo_total}
              receitaMensal={data.receita_mensal}
              despesaMensal={data.despesa_mensal}
            />

            <FinancialChart data={data.historico_30dias} />

            <GoalsPanel metas={data.metas} onSendCommand={sendCommand} />

            <AccountsPanel accounts={data.contas_cartoes} budgets={data.limites} />

            <TransactionsList transactions={data.transacoes} />
          </>
        )}
      </main>

      {/* FAB */}
      <FloatingActionButton onSendCommand={sendCommand} />
    </div>
  );
}

import { Moon, Sun, LogOut, RefreshCw, BarChart3, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  phoneNumber: string;
  onLogout: () => void;
  onNavigateToAnalytics?: () => void;
}

export default function Dashboard({ jid, phoneNumber, onLogout, onNavigateToAnalytics }: DashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const { data, loading, isNotFound, refresh, sendCommand } = useDashboard(jid, phoneNumber);

  if (isNotFound) {
    return <NotFoundState onLogout={onLogout} />;
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={mooviLogo} alt="Moovi" className="h-7 sm:h-8" />
            <h1 className="text-lg sm:text-xl font-bold hidden sm:block">Moovi.dash</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mobile: Hamburger Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3 mt-6">
                  {onNavigateToAnalytics && (
                    <Button
                      variant="outline"
                      onClick={onNavigateToAnalytics}
                      className="justify-start"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={toggleTheme}
                    className="justify-start"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon className="h-4 w-4 mr-2" />
                        Modo Escuro
                      </>
                    ) : (
                      <>
                        <Sun className="h-4 w-4 mr-2" />
                        Modo Claro
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onLogout}
                    className="justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop: Inline Buttons */}
            {onNavigateToAnalytics && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToAnalytics}
                className="hidden md:flex"
              >
                <BarChart3 className="h-4 w-4 md:mr-2" />
                <span className="hidden lg:inline">Analytics</span>
              </Button>
            )}
            
            {/* Always Visible: Refresh */}
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            {/* Desktop Only: Theme & Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden md:flex"
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
              className="hidden md:flex"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6 pb-24">
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

            <FinancialChart data={data.historico_30dias || []} />

            <GoalsPanel metas={data.metas || []} onSendCommand={sendCommand} />

            <AccountsPanel 
              accounts={data.contas_cartoes || []} 
              budgets={data.limites || []} 
              onSendCommand={sendCommand}
            />

            <TransactionsList transactions={data.transacoes || []} />
          </>
        )}
      </main>

      {/* FAB */}
      <FloatingActionButton onSendCommand={sendCommand} />
    </div>
  );
}

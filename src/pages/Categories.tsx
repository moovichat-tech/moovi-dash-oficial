import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Plus, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/useDashboard';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { CategoryTable } from '@/components/categories/CategoryTable';
import { NewCategoryModal } from '@/components/categories/NewCategoryModal';
import { useCommandFeedback } from '@/hooks/useCommandFeedback';
import { toast } from '@/hooks/use-toast';
import mooviLogo from '@/assets/moovi-logo-new.png';

interface CategoriesProps {
  jid: string;
  phoneNumber: string;
  onBack: () => void;
}

export default function Categories({ jid, phoneNumber, onBack }: CategoriesProps) {
  const { data, loading, refresh, sendCommand } = useDashboard(jid, phoneNumber);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const { showFeedback } = useCommandFeedback();

  // Buscar categorias via comando se não vieram da API
  useEffect(() => {
    const fetchCategoriesIfNeeded = async () => {
      if (data && !loadingCategories) {
        const hasGastos = data.categorias_de_gastos && data.categorias_de_gastos.length > 0;
        const hasGanhos = data.categorias_de_ganhos && data.categorias_de_ganhos.length > 0;
        
        // Se não temos categorias completas e temos apenas as extraídas das transações,
        // tentar buscar via comando
        if (!hasGastos && !hasGanhos) {
          setLoadingCategories(true);
          try {
            // Comando para listar categorias (que retorna cleanJson com categorias completas)
            await sendCommand('Listar minhas categorias');
          } catch (err) {
            console.error('Erro ao buscar categorias:', err);
          } finally {
            setLoadingCategories(false);
          }
        }
      }
    };

    fetchCategoriesIfNeeded();
  }, [data?.jid]); // Executar apenas quando os dados do usuário mudarem

  const handleDeleteCategory = async (categoryName: string) => {
    showFeedback('command', '🗑️ Excluindo categoria...');
    const command = `Excluir a categoria ${categoryName}`;
    
    try {
      await sendCommand(command);
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: 'Erro ao excluir categoria',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  if ((loading || loadingCategories) && !data) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  // Usar as categorias do formato correto da API
  const categoriasDeGastos = data?.categorias_de_gastos || [];
  const categoriasDeGanhos = data?.categorias_de_ganhos || [];
  const transactions = data?.todas_transacoes || data?.transacoes || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={mooviLogo} alt="Moovi" className="h-7 sm:h-8" />
            <h1 className="text-lg sm:text-xl font-bold">CATEGORIAS</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-6">
        {data && (
          <CurrencyProvider currency={data.configuracoes_usuario?.moeda || 'BRL'}>
            {/* Categorias de Gasto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Tags className="h-5 w-5" />
                  Categorias de Gasto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryTable
                  categoryNames={categoriasDeGastos}
                  transactions={transactions}
                  tipo="despesa"
                  onDelete={handleDeleteCategory}
                />
              </CardContent>
            </Card>

            {/* Categorias de Receita */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Tags className="h-5 w-5" />
                  Categorias de Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryTable
                  categoryNames={categoriasDeGanhos}
                  transactions={transactions}
                  tipo="receita"
                  onDelete={handleDeleteCategory}
                />
              </CardContent>
            </Card>
          </CurrencyProvider>
        )}
      </main>

      {/* Modal de Nova Categoria */}
      <NewCategoryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSendCommand={sendCommand}
      />
    </div>
  );
}

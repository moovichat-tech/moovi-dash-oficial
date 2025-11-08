import { useState, useEffect, useCallback } from 'react';
import { DashboardData } from '@/types/dashboard';
import { getDashboardData, postDashboardCommand, ApiError } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export function useDashboard(jid: string | null) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!jid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsNotFound(false);
      const dashboardData = await getDashboardData(jid);
      setData(dashboardData);
    } catch (err) {
      if (err instanceof ApiError && err.isNotFound) {
        setIsNotFound(true);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        toast({
          title: 'Erro ao carregar dados',
          description: err instanceof Error ? err.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [jid]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const sendCommand = useCallback(
    async (command: string) => {
      if (!jid) return;

      try {
        await postDashboardCommand(jid, command);
        // Após sucesso, recarregar todos os dados
        await loadDashboard();
        toast({
          title: 'Comando processado',
          description: 'Seus dados foram atualizados com sucesso.',
        });
      } catch (err) {
        toast({
          title: 'Erro ao processar comando',
          description: err instanceof Error ? err.message : 'Erro desconhecido',
          variant: 'destructive',
        });
        throw err;
      }
    },
    [jid, loadDashboard]
  );

  return {
    data,
    loading,
    error,
    isNotFound,
    refresh: loadDashboard,
    sendCommand,
  };
}

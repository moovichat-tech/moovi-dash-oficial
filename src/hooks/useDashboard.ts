import { useState, useEffect, useCallback } from 'react';
import { DashboardData } from '@/types/dashboard';
import { getDashboardData, postDashboardCommand, ApiError } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export function useDashboard(jid: string | null, phoneNumber: string | null) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!phoneNumber) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsNotFound(false);
      const dashboardData = await getDashboardData(phoneNumber, jid || undefined);
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
  }, [jid, phoneNumber]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const sendCommand = useCallback(
    async (command: string) => {
      if (!phoneNumber) return;

      try {
        setIsProcessingCommand(true);
        
        // Enviar comando
        await postDashboardCommand(phoneNumber, command);
        
        // ⏱️ AGUARDAR 2.5 segundos para n8n processar
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Recarregar dados atualizados
        await loadDashboard();
        
        toast({
          title: 'Comando processado ✅',
          description: 'Seus dados foram atualizados com sucesso.',
        });
      } catch (err) {
        toast({
          title: 'Erro ao processar comando',
          description: err instanceof Error ? err.message : 'Erro desconhecido',
          variant: 'destructive',
        });
        throw err;
      } finally {
        setIsProcessingCommand(false);
      }
    },
    [phoneNumber, loadDashboard]
  );

  return {
    data,
    loading,
    error,
    isNotFound,
    isProcessingCommand,
    refresh: loadDashboard,
    sendCommand,
  };
}

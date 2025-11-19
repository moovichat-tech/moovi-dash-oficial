import { useState, useEffect, useCallback } from 'react';
import { DashboardData } from '@/types/dashboard';
import { getDashboardData, postDashboardCommand, ApiError } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export function useDashboard(jid: string | null, phoneNumber: string | null) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
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
        // 🚀 Enviar comando (retorna rápido)
        await postDashboardCommand(phoneNumber, command);
        
        // ✅ Toast de sucesso IMEDIATO
        toast({
          title: 'Comando enviado ✅',
          description: 'Estamos processando sua solicitação. O dashboard será atualizado em breve.',
        });

        // 🔄 Processar em BACKGROUND (não bloqueia)
        setTimeout(async () => {
          try {
            await loadDashboard();
            toast({
              title: 'Dashboard atualizado 🎉',
              description: 'Seus dados foram atualizados com sucesso.',
            });
          } catch (err) {
            console.error('Erro ao atualizar dashboard:', err);
            toast({
              title: 'Falha na atualização',
              description: 'Tente recarregar manualmente.',
              variant: 'destructive',
            });
          }
        }, 2500);

      } catch (err) {
        toast({
          title: 'Erro ao enviar comando',
          description: err instanceof Error ? err.message : 'Erro desconhecido',
          variant: 'destructive',
        });
        throw err;
      }
    },
    [phoneNumber, loadDashboard]
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

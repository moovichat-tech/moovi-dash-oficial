import { toast } from '@/hooks/use-toast';

type CommandType = 'edit' | 'create' | 'command';

const messages: Record<CommandType, { title: string; description: string }> = {
  edit: {
    title: '✏️ Editando...',
    description: 'Aguarde alguns segundos enquanto processamos sua alteração.',
  },
  create: {
    title: '➕ Criando...',
    description: 'Sua solicitação está sendo processada. O dashboard será atualizado em breve.',
  },
  command: {
    title: '🚀 Enviando comando...',
    description: 'Processando sua solicitação. Aguarde a atualização do dashboard.',
  },
};

export function useCommandFeedback() {
  const showFeedback = (type: CommandType = 'command', customTitle?: string) => {
    const { title, description } = messages[type];
    toast({
      title: customTitle || title,
      description,
      duration: 4000,
    });
  };

  return { showFeedback };
}

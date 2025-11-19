import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Sparkles } from 'lucide-react';

interface ChatCommandProps {
  onSendCommand: (command: string) => Promise<void>;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function ChatCommand({ onSendCommand, disabled, isProcessing }: ChatCommandProps) {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);

  const isDisabled = loading || disabled || isProcessing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;

    const commandToSend = command;
    setCommand(''); // ✅ Limpa IMEDIATAMENTE (feedback visual)

    setLoading(true);
    try {
      await onSendCommand(commandToSend);
    } catch (error) {
      // Se der erro, restaura o comando para o usuário tentar novamente
      setCommand(commandToSend);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Adicionar despesa de R$ 50 em alimentação',
    'Quanto gastei este mês?',
    'Criar meta de R$ 5000 para viagem',
    'Listar minhas últimas transações',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Comando Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Digite seu comando em linguagem natural... Ex: 'Adicionar despesa de R$ 100 em supermercado'"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={isDisabled}
              rows={3}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCommand(suggestion)}
                  disabled={isDisabled}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isDisabled || !command.trim()}>
            {loading || isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isProcessing ? 'Processando comando...' : 'Processando...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Comando
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

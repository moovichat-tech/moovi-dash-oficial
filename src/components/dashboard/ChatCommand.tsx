import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Sparkles } from 'lucide-react';

interface ChatCommandProps {
  onSendCommand: (command: string) => void;
  disabled?: boolean;
}

export function ChatCommand({ onSendCommand, disabled }: ChatCommandProps) {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const commandToSend = command;
    setCommand(''); // Limpa imediatamente
    onSendCommand(commandToSend); // Fire-and-forget
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
              disabled={disabled}
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
                  disabled={disabled}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={disabled || !command.trim()}>
            <Send className="mr-2 h-4 w-4" />
            Enviar Comando
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

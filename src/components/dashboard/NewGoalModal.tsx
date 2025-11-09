import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface NewGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSendCommand: (command: string) => Promise<void>;
}

export function NewGoalModal({ open, onClose, onSendCommand }: NewGoalModalProps) {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestions = [
    'criar meta de R$5000 para viagem em 6 meses',
    'meta de R$1000 para notebook até dezembro',
    'quero juntar R$500 por mês para reserva de emergência',
  ];

  const handleSubmit = async () => {
    if (!command.trim()) return;

    setLoading(true);
    try {
      await onSendCommand(command);
      toast({
        title: 'Meta criada com sucesso!',
        description: 'Sua meta foi enviada para processamento.',
      });
      onClose();
      setCommand('');
    } catch (err) {
      toast({
        title: 'Erro ao criar meta',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Meta Financeira 🎯</DialogTitle>
          <DialogDescription>
            Use linguagem natural para criar sua meta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="command">Descreva sua meta</Label>
            <Textarea
              id="command"
              placeholder="Ex: Quero juntar R$5000 para viagem em 6 meses"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sugestões</Label>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((sug, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setCommand(sug)}
                  className="text-xs h-auto py-1.5 px-3"
                >
                  {sug}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={!command.trim() || loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Meta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

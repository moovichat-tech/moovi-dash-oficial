import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageCircle } from 'lucide-react';
import { ChatCommand } from './ChatCommand';

interface FloatingActionButtonProps {
  onSendCommand: (command: string) => Promise<void>;
}

export function FloatingActionButton({ onSendCommand }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-[var(--fab-shadow)] hover:scale-110 transition-transform z-50"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Comando Inteligente</DialogTitle>
            <DialogDescription>
              Use linguagem natural para adicionar transações, verificar saldos, criar metas e muito mais.
            </DialogDescription>
          </DialogHeader>
          <ChatCommand
            onSendCommand={async (command) => {
              try {
                setIsProcessing(true);
                await onSendCommand(command);
                setOpen(false); // ✅ Fecha IMEDIATAMENTE após envio
              } catch (err) {
                // Se der erro no envio, NÃO fecha o modal
                console.error('Erro ao enviar comando:', err);
              } finally {
                setIsProcessing(false);
              }
            }}
            isProcessing={isProcessing}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

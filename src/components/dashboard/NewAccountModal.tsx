import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { tapScale } from '@/lib/animations';

interface NewAccountModalProps {
  open: boolean;
  onClose: () => void;
  onSendCommand: (command: string) => Promise<void>;
}

export function NewAccountModal({ open, onClose, onSendCommand }: NewAccountModalProps) {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestions = [
    'adicionar conta corrente Nubank com saldo R$1500',
    'cadastrar cartão de crédito Inter com limite R$3000',
    'adicionar poupança Caixa com R$5000',
  ];

  const handleSubmit = async () => {
    if (!command.trim()) return;

    setLoading(true);
    try {
      await onSendCommand(command);
      toast({
        title: 'Conta adicionada com sucesso!',
        description: 'Sua conta foi enviada para processamento.',
      });
      onClose();
      setCommand('');
    } catch (err) {
      toast({
        title: 'Erro ao adicionar conta',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <AnimatePresence>
        {open && (
          <DialogContent className="sm:max-w-[500px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader>
                <DialogTitle>Nova Conta ou Cartão 💳</DialogTitle>
                <DialogDescription>
                  Use linguagem natural para adicionar sua conta
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Label htmlFor="command">Descreva sua conta</Label>
                  <Textarea
                    id="command"
                    placeholder="Ex: Adicionar conta corrente Nubank com saldo R$1500"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label className="text-xs text-muted-foreground">Sugestões</Label>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((sug, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={tapScale}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCommand(sug)}
                          className="text-xs h-auto py-1.5 px-3"
                        >
                          {sug}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  className="flex justify-end gap-2 pt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button variant="outline" onClick={onClose} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={!command.trim() || loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Adicionar
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

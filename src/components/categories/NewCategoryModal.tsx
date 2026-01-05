import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCommandFeedback } from '@/hooks/useCommandFeedback';
import { toast } from '@/hooks/use-toast';

interface NewCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSendCommand: (command: string) => Promise<void>;
}

export function NewCategoryModal({ open, onClose, onSendCommand }: NewCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'despesa' | 'receita'>('despesa');
  const [loading, setLoading] = useState(false);
  const { showFeedback } = useCommandFeedback();

  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome da categoria.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    showFeedback('create', '➕ Criando categoria...');
    onClose();

    const tipoTexto = categoryType === 'despesa' ? 'gasto' : 'receita';
    const command = `Criar a categoria de ${tipoTexto} com o nome ${categoryName.trim()}`;

    try {
      await onSendCommand(command);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: 'Erro ao criar categoria',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setCategoryName('');
      setCategoryType('despesa');
    }
  };

  const handleClose = () => {
    setCategoryName('');
    setCategoryType('despesa');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <AnimatePresence>
        {open && (
          <DialogContent className="sm:max-w-md" forceMount>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
                <DialogDescription>
                  Crie uma nova categoria para organizar suas transações.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Nome da categoria</Label>
                  <Input
                    id="category-name"
                    placeholder="Ex: Alimentação, Salário, Lazer..."
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && categoryName.trim()) {
                        handleSubmit();
                      }
                    }}
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                  <Label>Tipo de categoria</Label>
                  <RadioGroup
                    value={categoryType}
                    onValueChange={(value) => setCategoryType(value as 'despesa' | 'receita')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="despesa" id="despesa" />
                      <Label htmlFor="despesa" className="cursor-pointer font-normal">
                        Gasto
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="receita" id="receita" />
                      <Label htmlFor="receita" className="cursor-pointer font-normal">
                        Receita
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!categoryName.trim() || loading}
                >
                  Criar Categoria
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

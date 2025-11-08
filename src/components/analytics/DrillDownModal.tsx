import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategorySpending } from '@/types/analytics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DrillDownModalProps {
  category: CategorySpending;
  onClose: () => void;
}

export function DrillDownModal({ category, onClose }: DrillDownModalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category.categoria}</DialogTitle>
          <DialogDescription>
            {category.quantidade} transações • Total: {formatCurrency(category.total)} ({category.porcentagem.toFixed(1)}% do total)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {category.transacoes
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            .map((transacao) => (
              <div
                key={transacao.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{transacao.descricao}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                    <span>{formatDate(transacao.data)}</span>
                    <span>•</span>
                    <span>{transacao.conta_cartao}</span>
                    {transacao.recorrente && (
                      <>
                        <span>•</span>
                        <span className="text-primary">Recorrente</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-destructive">
                    {formatCurrency(transacao.valor)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

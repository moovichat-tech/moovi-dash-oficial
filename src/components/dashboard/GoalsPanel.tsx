import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Goal } from '@/types/dashboard';
import { GoalCard } from './GoalCard';
import { NewGoalModal } from './NewGoalModal';

interface GoalsPanelProps {
  metas: Goal[];
  onSendCommand: (command: string) => Promise<void>;
}

export function GoalsPanel({ metas, onSendCommand }: GoalsPanelProps) {
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Metas Financeiras</CardTitle>
              </div>
              <CardDescription className="mt-1">
                {metas.length} meta{metas.length !== 1 ? 's' : ''} cadastrada
                {metas.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowNewGoalModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nova Meta</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {metas.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">Nenhuma meta cadastrada ainda</p>
              <Button
                variant="link"
                className="text-primary"
                onClick={() => setShowNewGoalModal(true)}
              >
                Criar primeira meta →
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metas.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NewGoalModal
        open={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        onSendCommand={onSendCommand}
      />
    </>
  );
}

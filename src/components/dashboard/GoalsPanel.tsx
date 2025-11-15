import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Goal } from '@/types/dashboard';
import { GoalCard } from './GoalCard';
import { NewGoalModal } from './NewGoalModal';
import { containerVariants, fadeInVariants, tapScale } from '@/lib/animations';

interface GoalsPanelProps {
  metas: Goal[];
  onSendCommand: (command: string) => Promise<void>;
}

export function GoalsPanel({ metas, onSendCommand }: GoalsPanelProps) {
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Metas Financeiras</CardTitle>
              </div>
              <CardDescription className="mt-1">
                {metas?.length || 0} meta{(metas?.length || 0) !== 1 ? 's' : ''} cadastrada
                {(metas?.length || 0) !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={tapScale}
            >
              <Button size="sm" onClick={() => setShowNewGoalModal(true)}>
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Nova Meta</span>
              </Button>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          {!metas || metas.length === 0 ? (
            <motion.div 
              className="text-center py-12 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: 'easeInOut',
                }}
              >
                <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              </motion.div>
              <p className="text-muted-foreground mb-2">Nenhuma meta cadastrada ainda</p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={tapScale}
              >
                <Button
                  variant="link"
                  className="text-primary"
                  onClick={() => setShowNewGoalModal(true)}
                >
                  Criar primeira meta →
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {metas.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      <NewGoalModal
        open={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        onSendCommand={onSendCommand}
      />
    </>
  );
}

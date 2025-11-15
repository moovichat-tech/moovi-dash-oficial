import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFinancialHealth } from '@/hooks/useFinancialHealth';
import { useCountUp } from '@/hooks/useCountUp';
import { fadeInVariants, slideLeftVariants } from '@/lib/animations';

interface FinancialHealthScoreProps {
  receitaMensal: number;
  despesaMensal: number;
}

export function FinancialHealthScore({
  receitaMensal,
  despesaMensal,
}: FinancialHealthScoreProps) {
  const health = useFinancialHealth(receitaMensal, despesaMensal);
  const animatedScore = useCountUp(health.score, 1500);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      <Card className={`border-2 ${health.bgColor}`}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <motion.div 
            className="flex-1"
            variants={slideLeftVariants}
          >
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                  delay: 0.2 
                }}
              >
                <Activity className="h-5 w-5 text-primary" />
              </motion.div>
              <CardTitle>Saúde Financeira {health.emoji}</CardTitle>
            </div>
            <CardDescription className="mt-1.5">
              {health.message}
            </CardDescription>
          </motion.div>
          
          <motion.div 
            className={`text-4xl md:text-5xl font-bold ${health.color}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 150,
              damping: 12,
              delay: 0.3,
            }}
          >
            {animatedScore}
          </motion.div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Progress value={health.score} className="h-3" />
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs font-medium"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.6,
              },
            },
          }}
        >
          <motion.div 
            className="p-2 rounded-md bg-destructive/10 text-destructive"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            0-39 Crítico
          </motion.div>
          <motion.div 
            className="p-2 rounded-md bg-warning/10 text-warning"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            40-69 Atenção
          </motion.div>
          <motion.div 
            className="p-2 rounded-md bg-success/10 text-success"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            70-100 Saudável
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
    </motion.div>
  );
}

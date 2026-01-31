import { motion } from 'framer-motion';
import { ArrowRight, Target, Eye, Battery, Brain, AlertTriangle, Search, Grid3x3 } from 'lucide-react';
import { DecisionReason } from '@/types/simulation';
import { cn } from '@/lib/utils';

const iconMap = {
  Target,
  Eye,
  Battery,
  Brain,
  AlertTriangle,
  Search,
  Grid3x3,
  ArrowRight,
  Shuffle: Grid3x3,
  TrendingUp: ArrowRight,
};

interface DecisionBreakdownProps {
  reasons: DecisionReason[];
  algorithm: string;
}

export function DecisionBreakdown({ reasons, algorithm }: DecisionBreakdownProps) {
  if (reasons.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Decision Breakdown
        </h3>
        <div className="p-4 bg-secondary/30 rounded-md border border-border text-center">
          <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">
            Start simulation to see decision reasoning
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Decision Breakdown
        </h3>
        <span className="text-xs font-mono text-primary">{algorithm}</span>
      </div>
      
      <div className="space-y-2">
        {reasons.map((reason, index) => {
          const Icon = iconMap[reason.icon as keyof typeof iconMap] || Brain;
          
          return (
            <motion.div
              key={reason.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 bg-secondary/50 rounded-md border border-border"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-primary/20 rounded">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-tight">
                    {reason.reason}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${reason.weight}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {reason.weight}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

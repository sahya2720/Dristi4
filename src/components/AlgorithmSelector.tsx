import { motion } from 'framer-motion';
import {
  Shuffle,
  TrendingUp,
  Grid3x3,
  Target,
  Brain,
  LayoutGrid,
  Building2,
  Waypoints,
  AlertTriangle,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Algorithm, Environment, ALGORITHMS, ENVIRONMENTS } from '@/types/simulation';

const iconMap = {
  Shuffle,
  TrendingUp,
  Grid3x3,
  Target,
  Brain,
  LayoutGrid,
  Building2,
  Waypoints,
  AlertTriangle,
  RefreshCw,
  Cloud,
};

interface AlgorithmSelectorProps {
  currentAlgorithm: Algorithm;
  onSelect: (algorithm: Algorithm) => void;
}

export function AlgorithmSelector({ currentAlgorithm, onSelect }: AlgorithmSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Patrol Algorithm
      </h3>
      <div className="space-y-2">
        {ALGORITHMS.map((algo) => {
          const Icon = iconMap[algo.icon as keyof typeof iconMap];
          const isActive = currentAlgorithm === algo.id;
          
          return (
            <motion.button
              key={algo.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(algo.id)}
              className={cn(
                'w-full p-3 rounded-md border text-left transition-all duration-200',
                'hover:border-primary/50',
                isActive
                  ? 'bg-primary/10 border-primary'
                  : 'bg-secondary/50 border-border'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'p-2 rounded-md',
                    isActive ? 'bg-primary/20' : 'bg-muted'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'font-medium text-sm',
                        isActive ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {algo.name}
                    </span>
                    <span
                      className={cn(
                        'font-mono text-xs px-1.5 py-0.5 rounded',
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {algo.id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {algo.description}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

interface EnvironmentSelectorProps {
  currentEnvironment: Environment;
  onSelect: (environment: Environment) => void;
}

export function EnvironmentSelector({ currentEnvironment, onSelect }: EnvironmentSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Environment
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {ENVIRONMENTS.map((env) => {
          const Icon = iconMap[env.icon as keyof typeof iconMap];
          const isActive = currentEnvironment === env.id;
          
          return (
            <motion.button
              key={env.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(env.id)}
              className={cn(
                'p-3 rounded-md border text-left transition-all duration-200',
                'hover:border-primary/50',
                isActive
                  ? 'bg-primary/10 border-primary'
                  : 'bg-secondary/50 border-border'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={cn(
                    'w-4 h-4',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'font-medium text-xs',
                    isActive ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {env.name}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

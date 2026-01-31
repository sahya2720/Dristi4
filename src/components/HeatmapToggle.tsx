import { motion } from 'framer-motion';
import { Layers, Map, AlertTriangle, HelpCircle } from 'lucide-react';
import { HeatmapType } from '@/types/simulation';
import { cn } from '@/lib/utils';

interface HeatmapToggleProps {
  activeHeatmap: HeatmapType;
  onSelect: (heatmap: HeatmapType) => void;
}

const heatmaps: { id: HeatmapType; name: string; icon: React.ElementType; description: string }[] = [
  { id: 'none', name: 'None', icon: Layers, description: 'No overlay' },
  { id: 'coverage', name: 'Coverage', icon: Map, description: 'Area visibility' },
  { id: 'threat', name: 'Threat', icon: AlertTriangle, description: 'Risk levels' },
  { id: 'uncertainty', name: 'Uncertainty', icon: HelpCircle, description: 'Unknown areas' },
];

export function HeatmapToggle({ activeHeatmap, onSelect }: HeatmapToggleProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Heatmap Overlay
      </h3>
      
      <div className="flex gap-1">
        {heatmaps.map((heatmap) => {
          const Icon = heatmap.icon;
          const isActive = activeHeatmap === heatmap.id;
          
          return (
            <motion.button
              key={heatmap.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(heatmap.id)}
              className={cn(
                'flex-1 p-2 rounded-md border transition-all duration-200',
                'flex flex-col items-center gap-1',
                isActive
                  ? 'bg-primary/10 border-primary'
                  : 'bg-secondary/50 border-border hover:border-primary/50'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'text-xs',
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {heatmap.name}
              </span>
            </motion.button>
          );
        })}
      </div>
      
      {activeHeatmap !== 'none' && (
        <div className="p-2 bg-secondary/30 rounded-md">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Low</span>
            <span>High</span>
          </div>
          <div
            className={cn(
              'h-2 rounded-full',
              activeHeatmap === 'coverage' && 'bg-gradient-to-r from-danger via-warning to-success',
              activeHeatmap === 'threat' && 'bg-gradient-to-r from-success via-warning to-danger',
              activeHeatmap === 'uncertainty' && 'bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-600'
            )}
          />
        </div>
      )}
    </div>
  );
}

import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Battery,
  Clock,
  Target,
  Gauge,
  Activity,
  Zap,
} from 'lucide-react';
import { Metrics } from '@/types/simulation';
import { cn } from '@/lib/utils';

interface MetricsPanelProps {
  metrics: Metrics;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'danger' | 'success';
  progress?: number;
}

function MetricCard({ icon, label, value, unit, status = 'normal', progress }: MetricCardProps) {
  const statusColors = {
    normal: 'text-foreground',
    warning: 'text-warning',
    danger: 'text-danger',
    success: 'text-success',
  };

  const progressColors = {
    normal: 'bg-primary',
    warning: 'bg-warning',
    danger: 'bg-danger',
    success: 'bg-success',
  };

  return (
    <div className="p-3 bg-secondary/50 rounded-md border border-border">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn('font-mono text-xl font-semibold', statusColors[status])}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        {unit && (
          <span className="text-xs text-muted-foreground">{unit}</span>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', progressColors[status])}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </div>
  );
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const getBatteryStatus = (battery: number) => {
    if (battery < 20) return 'danger';
    if (battery < 40) return 'warning';
    return 'normal';
  };

  const getCoverageStatus = (coverage: number) => {
    if (coverage > 70) return 'success';
    if (coverage > 40) return 'normal';
    return 'warning';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Live Metrics
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          icon={<Eye className="w-4 h-4" />}
          label="Area Observed"
          value={metrics.areaObserved}
          unit="%"
          status={getCoverageStatus(metrics.areaObserved)}
          progress={metrics.areaObserved}
        />
        
        <MetricCard
          icon={<EyeOff className="w-4 h-4" />}
          label="Blind Spots"
          value={metrics.blindSpots}
          unit="%"
          status={metrics.blindSpots > 50 ? 'danger' : metrics.blindSpots > 30 ? 'warning' : 'success'}
          progress={metrics.blindSpots}
        />
        
        <MetricCard
          icon={<Target className="w-4 h-4" />}
          label="Detected"
          value={`${metrics.intrudersDetected}/${metrics.totalIntruders}`}
          status={metrics.intrudersDetected === metrics.totalIntruders ? 'success' : 'warning'}
        />
        
        <MetricCard
          icon={<Clock className="w-4 h-4" />}
          label="Avg Latency"
          value={metrics.detectionLatency}
          unit="s"
          status={metrics.detectionLatency > 10 ? 'danger' : metrics.detectionLatency > 5 ? 'warning' : 'success'}
        />
        
        <MetricCard
          icon={<Battery className="w-4 h-4" />}
          label="Battery"
          value={metrics.battery}
          unit="%"
          status={getBatteryStatus(metrics.battery)}
          progress={metrics.battery}
        />
        
        <MetricCard
          icon={<Gauge className="w-4 h-4" />}
          label="Efficiency"
          value={metrics.patrolEfficiency}
          unit="pts"
          status={metrics.patrolEfficiency > 5 ? 'success' : 'normal'}
        />
      </div>
    </div>
  );
}

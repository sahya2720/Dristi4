import { motion } from 'framer-motion';
import { AlertTriangle, Eye, Navigation, Settings, Zap } from 'lucide-react';
import { TimelineEvent } from '@/types/simulation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const iconMap = {
  detection: Eye,
  patrol: Navigation,
  alert: AlertTriangle,
  decision: Zap,
  environment: Settings,
};

interface EventTimelineProps {
  events: TimelineEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 flex flex-col min-h-0">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Event Timeline
      </h3>
      
      <ScrollArea className="flex-1 pr-2">
        {events.length === 0 ? (
          <div className="p-4 bg-secondary/30 rounded-md border border-border text-center">
            <Navigation className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No events yet
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {events.slice(0, 20).map((event, index) => {
              const Icon = iconMap[event.type];
              
              const severityColors = {
                info: 'border-primary/50 text-primary',
                warning: 'border-warning/50 text-warning',
                danger: 'border-danger/50 text-danger',
              };
              
              const dotColors = {
                info: 'bg-primary',
                warning: 'bg-warning',
                danger: 'bg-danger',
              };

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-5 pb-3 border-l border-border last:pb-0"
                >
                  <div
                    className={cn(
                      'absolute left-0 top-1 w-2 h-2 rounded-full -translate-x-1/2',
                      dotColors[event.severity]
                    )}
                  />
                  
                  <div className="flex items-start gap-2">
                    <Icon
                      className={cn(
                        'w-3.5 h-3.5 mt-0.5 flex-shrink-0',
                        severityColors[event.severity]
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-tight">
                        {event.message}
                      </p>
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertState } from '@/hooks/useAlertSystem';
import { cn } from '@/lib/utils';

interface AlertOverlayProps {
  alertState: AlertState;
  onToggleMute: () => void;
  className?: string;
}

export function AlertOverlay({ alertState, onToggleMute, className }: AlertOverlayProps) {
  return (
    <>
      {/* Full-screen flash effect */}
      <AnimatePresence>
        {alertState.isAlertActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 bg-danger pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      {/* Alert status bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center justify-between p-2 rounded-md border',
          alertState.isAlertActive
            ? 'bg-danger/20 border-danger'
            : 'bg-card/50 border-border',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={cn(
              'w-4 h-4',
              alertState.isAlertActive ? 'text-danger animate-pulse' : 'text-muted-foreground'
            )}
          />
          <span className="text-xs font-mono">
            Alerts: <span className={cn(
              'font-bold',
              alertState.alertCount > 0 ? 'text-danger' : 'text-foreground'
            )}>{alertState.alertCount}</span>
          </span>
          {alertState.lastAlertTime && (
            <span className="text-xs text-muted-foreground font-mono">
              | Last: {new Date(alertState.lastAlertTime).toLocaleTimeString()}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onToggleMute}
        >
          {alertState.isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-foreground" />
          )}
        </Button>
      </motion.div>

      {/* Screen border glow when alert active */}
      <AnimatePresence>
        {alertState.isAlertActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              boxShadow: 'inset 0 0 100px 20px rgba(239, 68, 68, 0.3)',
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

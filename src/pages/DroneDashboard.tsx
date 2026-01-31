import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Navigation, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { DroneScene } from '@/components/DroneScene';
import { SimulationControls } from '@/components/SimulationControls';
import { AlgorithmSelector, EnvironmentSelector } from '@/components/AlgorithmSelector';
import { MetricsPanel } from '@/components/MetricsPanel';
import { DecisionBreakdown } from '@/components/DecisionBreakdown';
import { EventTimeline } from '@/components/EventTimeline';
import { HeatmapToggle } from '@/components/HeatmapToggle';
import { AlertOverlay } from '@/components/AlertOverlay';
import { useSimulation } from '@/hooks/useSimulation';
import { useAlertSystem } from '@/hooks/useAlertSystem';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { TimelineEvent } from '@/types/simulation';

export default function DroneDashboard() {
  const { state, actions } = useSimulation();
  const [isRecording, setIsRecording] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Handle adding CV detection events to timeline
  const handleTimelineEvent = useCallback((event: TimelineEvent) => {
    actions.addTimelineEvent(event);
  }, [actions]);

  // Screenshot function for CV detection
  // Screenshot function for CV detection
  const handleCVScreenshot = useCallback(() => {
    // Feature removed
    return null;
  }, []);

  // Alert system
  const { state: alertState, handleDetection, toggleMute } = useAlertSystem({
    onScreenshot: handleCVScreenshot,
    onTimelineEvent: handleTimelineEvent,
    cooldownMs: 3000,
  });

  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector('#drone-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `drone-dashboard-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    const canvas = document.querySelector('#drone-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
        });

        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `drone-recording-${Date.now()}.webm`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {/* Alert overlay - renders flash and status */}
      <AlertOverlay
        alertState={alertState}
        onToggleMute={toggleMute}
        className="absolute top-20 left-4 z-20"
      />

      {/* Main 3D View */}
      <div className="flex-1 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-0 right-0 z-10 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                <Navigation className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                  Perception-Aware Drone Dashboard
                </h1>
                <p className="text-xs text-muted-foreground">
                  Real-time patrol simulation & CV detection
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">

              <div className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-md border border-border">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  state.isRunning && !state.isPaused
                    ? 'bg-success animate-pulse'
                    : state.isPaused
                      ? 'bg-warning'
                      : 'bg-muted-foreground'
                )} />
                <span className="text-xs font-mono uppercase">
                  {state.isRunning && !state.isPaused
                    ? 'Running'
                    : state.isPaused
                      ? 'Paused'
                      : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3D Scene */}
        <DroneScene state={state} />



        {/* Simulation Controls */}
        <SimulationControls
          state={state}
          onStart={actions.startSimulation}
          onPause={actions.pauseSimulation}
          onResume={actions.resumeSimulation}
          onStop={actions.stopSimulation}
          onReset={actions.resetSimulation}
          onSpeedChange={actions.setSpeed}
          onScreenshot={handleScreenshot}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          isRecording={isRecording}
        />

        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-36 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-danger/20 border border-danger/50 rounded-md"
          >
            <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span className="text-xs font-mono text-danger">REC</span>
          </motion.div>
        )}
      </div>

      {/* Collapse/Expand button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-[calc(theme(spacing.80)+0.5rem)] top-1/2 -translate-y-1/2 z-20 rounded-full shadow-lg"
        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
        style={{ right: isPanelCollapsed ? '0.5rem' : 'calc(20rem + 0.5rem)' }}
      >
        {isPanelCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {/* Control Panel */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isPanelCollapsed ? '100%' : 0 }}
        transition={{ duration: 0.3 }}
        className="w-80 h-full bg-card border-l border-border flex flex-col"
      >
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Algorithm Selector */}
            <AlgorithmSelector
              currentAlgorithm={state.currentAlgorithm}
              onSelect={actions.setAlgorithm}
            />

            <Separator />

            {/* Environment Selector */}
            <EnvironmentSelector
              currentEnvironment={state.currentEnvironment}
              onSelect={actions.setEnvironment}
            />

            <Separator />

            {/* Heatmap Toggle */}
            <HeatmapToggle
              activeHeatmap={state.activeHeatmap}
              onSelect={actions.setHeatmap}
            />

            <Separator />

            {/* Metrics Panel */}
            <MetricsPanel metrics={state.metrics} />

            <Separator />

            {/* Decision Breakdown */}
            <DecisionBreakdown
              reasons={state.decisionReasons}
              algorithm={state.currentAlgorithm}
            />

            <Separator />

            {/* Event Timeline */}
            <div className="min-h-[200px]">
              <EventTimeline events={state.timeline} />
            </div>
          </div>
        </ScrollArea>

        {/* Panel Footer */}
        <div className="p-3 border-t border-border bg-secondary/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>v1.1.0 + CV Detection</span>
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Demo Mode</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

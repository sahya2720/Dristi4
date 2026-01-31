import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  FastForward,
  Camera,
  Video,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { SimulationState } from '@/types/simulation';

interface SimulationControlsProps {
  state: SimulationState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onScreenshot: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
}

export function SimulationControls({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onSpeedChange,
  onScreenshot,
  onStartRecording,
  onStopRecording,
  isRecording,
}: SimulationControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-4 left-4 right-4 z-10"
    >
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Playback controls */}
          <div className="flex items-center gap-2">
            {!state.isRunning ? (
              <Button
                variant="default"
                size="sm"
                onClick={onStart}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Play className="w-4 h-4" />
                Start
              </Button>
            ) : state.isPaused ? (
              <Button
                variant="default"
                size="sm"
                onClick={onResume}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={onPause}
                className="gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={onStop}
              disabled={!state.isRunning}
            >
              <Square className="w-4 h-4" />
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={onReset}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="font-mono text-lg text-foreground">
                {formatTime(state.elapsedTime)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Elapsed
              </div>
            </div>
          </div>

          {/* Speed control */}
          <div className="flex items-center gap-3 min-w-[180px]">
            <FastForward className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[state.speed]}
              onValueChange={([value]) => onSpeedChange(value)}
              min={0.25}
              max={4}
              step={0.25}
              className="flex-1"
            />
            <span className="font-mono text-sm w-12 text-right">
              {state.speed}x
            </span>
          </div>

          {/* Export controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onScreenshot}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Screenshot</span>
            </Button>

            {isRecording ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={onStopRecording}
                className="gap-2 animate-pulse"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={onStartRecording}
                className="gap-2"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Record</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, AlertTriangle, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCVDetection, Detection } from '@/hooks/useCVDetection';
import { cn } from '@/lib/utils';

interface WebcamDetectorProps {
  onDetection: (detection: Detection) => void;
  isEnabled: boolean;
  onToggle: () => void;
  className?: string;
}

export interface WebcamDetectorRef {
  takeScreenshot: () => string | null;
}

export const WebcamDetector = forwardRef<WebcamDetectorRef, WebcamDetectorProps>(
  ({ onDetection, isEnabled, onToggle, className }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const onDetectionRef = useRef(onDetection);
    const { state, actions } = useCVDetection();

    // Keep onDetection ref updated
    onDetectionRef.current = onDetection;

    // Expose screenshot function
    useImperativeHandle(ref, () => ({
      takeScreenshot: () => {
        if (!videoRef.current || !canvasRef.current) return null;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        // Draw video frame
        ctx.drawImage(video, 0, 0);
        
        // Draw detection boxes
        state.detections.forEach(det => {
          const [x, y, width, height] = det.bbox;
          
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);
          
          // Label background
          ctx.fillStyle = '#ef4444';
          const labelText = `${det.label} ${Math.round(det.confidence * 100)}%`;
          const labelWidth = ctx.measureText(labelText).width + 10;
          ctx.fillRect(x, y - 25, labelWidth, 25);
          
          // Label text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px JetBrains Mono';
          ctx.fillText(labelText, x + 5, y - 7);
        });
        
        // Add timestamp
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, canvas.height - 35, 200, 25);
        ctx.fillStyle = '#22d3ee';
        ctx.font = '12px JetBrains Mono';
        ctx.fillText(`ALERT: ${new Date().toISOString()}`, 15, canvas.height - 17);
        
        return canvas.toDataURL('image/png');
      },
    }));

    // Load model on mount (only once)
    useEffect(() => {
      actions.loadModel();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle camera enable/disable
    useEffect(() => {
      const video = videoRef.current;
      
      if (isEnabled && state.isModelReady && video) {
        let isCancelled = false;
        
        actions.startCamera(video).then(() => {
          if (!isCancelled) {
            setTimeout(() => {
              if (!isCancelled) {
                actions.startDetection((detection) => {
                  onDetectionRef.current(detection);
                });
              }
            }, 500);
          }
        });

        return () => {
          isCancelled = true;
          actions.stopDetection();
          actions.stopCamera();
        };
      } else if (!isEnabled) {
        actions.stopDetection();
        actions.stopCamera();
      }
      // Only depend on isEnabled and isModelReady - actions are stable refs
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEnabled, state.isModelReady]);

    const hasDetections = state.detections.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'relative rounded-lg border overflow-hidden bg-secondary/30',
          hasDetections && 'border-danger ring-2 ring-danger/50',
          !hasDetections && 'border-border',
          className
        )}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-gradient-to-b from-background/90 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono uppercase text-muted-foreground">
                CV Detection
              </span>
              {state.isDetecting && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-mono text-success">ACTIVE</span>
                </div>
              )}
            </div>
            <Button
              variant={isEnabled ? 'destructive' : 'secondary'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={onToggle}
              disabled={state.isModelLoading}
            >
              {isEnabled ? (
                <>
                  <CameraOff className="w-3 h-3" />
                  Disable
                </>
              ) : (
                <>
                  <Camera className="w-3 h-3" />
                  Enable
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Video feed */}
        <div className="relative aspect-video bg-background">
          <video
            ref={videoRef}
            className={cn(
              'w-full h-full object-cover',
              !isEnabled && 'hidden'
            )}
            muted
            playsInline
          />
          
          {/* Hidden canvas for screenshots */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Detection boxes overlay */}
          <AnimatePresence>
            {state.detections.map((detection) => {
              const [x, y, width, height] = detection.bbox;
              const videoEl = videoRef.current;
              if (!videoEl) return null;
              
              // Scale bbox to container size
              const scaleX = videoEl.clientWidth / videoEl.videoWidth;
              const scaleY = videoEl.clientHeight / videoEl.videoHeight;
              
              return (
                <motion.div
                  key={detection.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute border-2 border-danger rounded-sm pointer-events-none"
                  style={{
                    left: x * scaleX,
                    top: y * scaleY,
                    width: width * scaleX,
                    height: height * scaleY,
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-danger text-danger-foreground px-1.5 py-0.5 text-[10px] font-mono rounded-t-sm whitespace-nowrap">
                    {detection.label} {Math.round(detection.confidence * 100)}%
                  </div>
                  {/* Corner markers */}
                  <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-danger" />
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-danger" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-danger" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-danger" />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading state */}
          {state.isModelLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <span className="text-sm text-muted-foreground">Loading CV Model...</span>
            </div>
          )}

          {/* Disabled state */}
          {!isEnabled && !state.isModelLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90">
              <CameraOff className="w-12 h-12 text-muted-foreground/50 mb-2" />
              <span className="text-sm text-muted-foreground">Camera Disabled</span>
              <span className="text-xs text-muted-foreground/70 mt-1">Click Enable to start CV detection</span>
            </div>
          )}

          {/* Error state */}
          {state.error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-danger/10 p-4">
              <AlertTriangle className="w-8 h-8 text-danger mb-2" />
              <span className="text-sm text-danger text-center">{state.error}</span>
            </div>
          )}

          {/* Detection alert flash */}
          <AnimatePresence>
            {hasDetections && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="absolute inset-0 bg-danger/20 pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Detection info bar */}
        <div className="p-2 bg-card/50 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono">
              Detections: <span className={cn(
                'font-bold',
                hasDetections ? 'text-danger' : 'text-foreground'
              )}>{state.detections.length}</span>
            </span>
            {state.lastDetectionTime && (
              <span className="text-muted-foreground font-mono">
                Last: {new Date(state.lastDetectionTime).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

WebcamDetector.displayName = 'WebcamDetector';

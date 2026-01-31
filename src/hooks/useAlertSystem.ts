import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Detection } from './useCVDetection';
import { TimelineEvent } from '@/types/simulation';

export interface AlertState {
  isAlertActive: boolean;
  lastAlertTime: number | null;
  alertCount: number;
  isMuted: boolean;
}

interface UseAlertSystemOptions {
  onScreenshot: () => string | null;
  onTimelineEvent: (event: TimelineEvent) => void;
  cooldownMs?: number;
}

export const useAlertSystem = ({
  onScreenshot,
  onTimelineEvent,
  cooldownMs = 3000, // Minimum 3 seconds between alerts
}: UseAlertSystemOptions) => {
  const [state, setState] = useState<AlertState>({
    isAlertActive: false,
    lastAlertTime: null,
    alertCount: 0,
    isMuted: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAlertTimeRef = useRef<number | null>(null);

  // Play alarm sound using Web Audio API
  const playAlarm = useCallback(() => {
    if (state.isMuted) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Create a more urgent alarm pattern
      for (let i = 0; i < 3; i++) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Alternating high-low frequency for urgency
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, now + i * 0.3);
        oscillator.frequency.setValueAtTime(440, now + i * 0.3 + 0.15);

        gainNode.gain.setValueAtTime(0.15, now + i * 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.25);

        oscillator.start(now + i * 0.3);
        oscillator.stop(now + i * 0.3 + 0.3);
      }
    } catch (error) {
      console.error('[Alert] Failed to play alarm sound:', error);
    }
  }, [state.isMuted]);

  // Trigger visual flash effect
  const triggerFlash = useCallback(() => {
    setState(prev => ({ ...prev, isAlertActive: true }));

    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    alertTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isAlertActive: false }));
    }, 1000);
  }, []);

  // Handle detection and trigger full alert suite
  const handleDetection = useCallback((detection: Detection) => {
    const now = Date.now();
    
    // Check cooldown using ref for immediate access without dependency
    if (lastAlertTimeRef.current && (now - lastAlertTimeRef.current) < cooldownMs) {
      return;
    }

    // Update ref immediately for cooldown tracking
    lastAlertTimeRef.current = now;

    console.log('[Alert] Intruder detected:', detection.label, detection.confidence);

    // Update state
    setState(prev => ({
      ...prev,
      lastAlertTime: now,
      alertCount: prev.alertCount + 1,
    }));

    // 1. Play alarm sound
    playAlarm();

    // 2. Trigger visual flash
    triggerFlash();

    // 3. Auto-capture screenshot
    const screenshotData = onScreenshot();
    if (screenshotData) {
      // Download the screenshot automatically
      const link = document.createElement('a');
      link.download = `intruder-alert-${now}.png`;
      link.href = screenshotData;
      link.click();
      console.log('[Alert] Screenshot captured and saved');
    }

    // 4. Add to timeline
    const timelineEvent: TimelineEvent = {
      id: `cv-detection-${now}`,
      timestamp: now / 1000,
      type: 'alert',
      message: `CV DETECTION: ${detection.label} detected (${Math.round(detection.confidence * 100)}% confidence)`,
      severity: 'danger',
    };
    onTimelineEvent(timelineEvent);

    // 5. Show popup notification
    toast.error('🚨 INTRUDER DETECTED', {
      description: `${detection.label.toUpperCase()} detected with ${Math.round(detection.confidence * 100)}% confidence. Screenshot captured.`,
      duration: 5000,
      position: 'top-center',
      style: {
        background: 'hsl(var(--danger))',
        color: 'white',
        border: 'none',
      },
    });

  }, [cooldownMs, playAlarm, triggerFlash, onScreenshot, onTimelineEvent]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // Reset alert count
  const resetAlerts = useCallback(() => {
    setState(prev => ({ ...prev, alertCount: 0, isAlertActive: false }));
  }, []);

  return {
    state,
    handleDetection,
    toggleMute,
    resetAlerts,
  };
};

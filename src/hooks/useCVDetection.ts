import { useState, useCallback, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export interface Detection {
  id: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  timestamp: number;
}

export interface CVDetectionState {
  isModelLoading: boolean;
  isModelReady: boolean;
  isDetecting: boolean;
  isCameraActive: boolean;
  detections: Detection[];
  lastDetectionTime: number | null;
  error: string | null;
}

// Detectable classes that we consider as "intruders"
const INTRUDER_CLASSES = ['person', 'car', 'truck', 'motorcycle', 'bicycle', 'dog', 'cat'];

export const useCVDetection = () => {
  const [state, setState] = useState<CVDetectionState>({
    isModelLoading: false,
    isModelReady: false,
    isDetecting: false,
    isCameraActive: false,
    detections: [],
    lastDetectionTime: null,
    error: null,
  });

  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectionCallbackRef = useRef<((detection: Detection) => void) | null>(null);

  // Load the COCO-SSD model
  const loadModel = useCallback(async () => {
    if (modelRef.current || state.isModelLoading) return;

    setState(prev => ({ ...prev, isModelLoading: true, error: null }));

    try {
      await tf.ready();
      console.log('[CV] TensorFlow.js backend:', tf.getBackend());

      const model = await cocoSsd.load({
        base: 'lite_mobilenet_v2', // Faster model for real-time detection
      });

      modelRef.current = model;
      setState(prev => ({
        ...prev,
        isModelLoading: false,
        isModelReady: true,
      }));
      console.log('[CV] COCO-SSD model loaded successfully');
    } catch (error) {
      console.error('[CV] Failed to load model:', error);
      setState(prev => ({
        ...prev,
        isModelLoading: false,
        error: 'Failed to load CV model. Please refresh and try again.',
      }));
    }
  }, [state.isModelLoading]);

  // Start camera
  const startCamera = useCallback(async (video: HTMLVideoElement) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      video.srcObject = stream;
      await video.play();

      videoRef.current = video;
      streamRef.current = stream;

      setState(prev => ({ ...prev, isCameraActive: true, error: null }));
      console.log('[CV] Camera started successfully');
    } catch (error) {
      console.error('[CV] Camera access denied:', error);
      setState(prev => ({
        ...prev,
        error: 'Camera access denied. Please allow camera access to use CV detection.',
      }));
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    setState(prev => ({ ...prev, isCameraActive: false }));
    console.log('[CV] Camera stopped');
  }, []);

  // Run detection loop
  const startDetection = useCallback((onDetection?: (detection: Detection) => void) => {
    if (!modelRef.current || !videoRef.current) {
      console.warn('[CV] Cannot start detection: model or video not ready');
      return;
    }

    detectionCallbackRef.current = onDetection || null;
    setState(prev => ({ ...prev, isDetecting: true }));

    const detect = async () => {
      if (!modelRef.current || !videoRef.current || !state.isDetecting) return;

      try {
        const predictions = await modelRef.current.detect(videoRef.current);

        const relevantDetections = predictions
          .filter(pred => INTRUDER_CLASSES.includes(pred.class) && pred.score > 0.5)
          .map((pred, index) => ({
            id: `detection-${Date.now()}-${index}`,
            label: pred.class,
            confidence: pred.score,
            bbox: pred.bbox as [number, number, number, number],
            timestamp: Date.now(),
          }));

        if (!videoRef.current || !state.isDetecting) return; // Double check after await

        if (relevantDetections.length > 0) {
          setState(prev => ({
            ...prev,
            detections: relevantDetections,
            lastDetectionTime: Date.now(),
          }));

          // Trigger callback for each new detection
          relevantDetections.forEach(detection => {
            if (detectionCallbackRef.current) {
              detectionCallbackRef.current(detection);
            }
          });
        } else {
          setState(prev => ({ ...prev, detections: [] }));
        }
      } catch (error) {
        console.error('[CV] Detection error:', error);
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
    console.log('[CV] Detection loop started');
    detect();
    console.log('[CV] Detection loop started');
  }, [state.isDetecting]); // Removed state.isDetecting from dependency as it causes loop restart loops. 
  // Actually, wait, if I remove it, it won't react to changes? 
  // The 'detect' function is recursive via requestAnimationFrame, so it just needs to start once.
  // The 'state.isDetecting' check inside 'detect' handles the stopping.
  // BUT 'startDetection' is called by the component.
  // Let's just fix the internal safety check.


  // Stop detection loop
  const stopDetection = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    detectionCallbackRef.current = null;
    setState(prev => ({ ...prev, isDetecting: false, detections: [] }));
    console.log('[CV] Detection loop stopped');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
      stopCamera();
      modelRef.current = null;
    };
  }, [stopDetection, stopCamera]);

  // Set detection callback
  const setDetectionCallback = useCallback((callback: (detection: Detection) => void) => {
    detectionCallbackRef.current = callback;
  }, []);

  return {
    state,
    videoRef,
    actions: {
      loadModel,
      startCamera,
      stopCamera,
      startDetection,
      stopDetection,
      setDetectionCallback,
    },
  };
};

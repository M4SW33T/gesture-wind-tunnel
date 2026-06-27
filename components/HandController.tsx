import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

type HandData = {
  x: number;
  openness: number;
  isPresent: boolean;
};

type VisionStatus = 'idle' | 'loading' | 'ready' | 'camera' | 'tracking' | 'lost' | 'error';

interface HandControllerProps {
  onHandUpdate: (data: HandData) => void;
  active: boolean;
  onError?: (error: string) => void;
  onStatusChange?: (status: VisionStatus) => void;
}

type Landmark = {
  x: number;
  y: number;
  z?: number;
};

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const SMOOTHING = 0.22;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const distance = (p1: Landmark, p2: Landmark) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

const getHandOpenness = (landmarks: Landmark[]) => {
  const palmSize = distance(landmarks[0], landmarks[5]);
  if (palmSize <= 0.001) return 0.72;

  const fingerTips = [8, 12, 16, 20];
  const avgTipDistance = fingerTips.reduce((sum, tipIndex) => sum + distance(landmarks[0], landmarks[tipIndex]), 0) / fingerTips.length;

  return clamp01((avgTipDistance / palmSize - 0.75) / 1.35);
};

const HandController: React.FC<HandControllerProps> = ({ onHandUpdate, active, onError, onStatusChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const smoothedRef = useRef<HandData>({ x: 0.5, openness: 0.72, isPresent: false });
  const missingFramesRef = useRef(0);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const setupMediaPipe = async () => {
      try {
        onStatusChange?.('loading');
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);

        const createLandmarker = async (delegate: 'GPU' | 'CPU') => HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate,
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });

        let landmarker: HandLandmarker;
        try {
          landmarker = await createLandmarker('GPU');
        } catch {
          landmarker = await createLandmarker('CPU');
        }

        if (!cancelled) {
          handLandmarkerRef.current = landmarker;
          setIsSetup(true);
          onStatusChange?.('ready');
        } else {
          landmarker.close();
        }
      } catch (e) {
        console.error('MediaPipe init error:', e);
        if (!cancelled) {
          onStatusChange?.('error');
          onError?.('Failed to load the hand-tracking engine. Please check your network connection and refresh.');
        }
      }
    };

    setupMediaPipe();

    return () => {
      cancelled = true;
    };
  }, [onError, onStatusChange]);

  useEffect(() => {
    if (!active) {
      onStatusChange?.('idle');
      return;
    }

    if (!isSetup || !videoRef.current) {
      onStatusChange?.('loading');
      return;
    }

    let stream: MediaStream | null = null;
    let isActiveSession = true;

    const publishMissingHand = () => {
      missingFramesRef.current += 1;
      if (missingFramesRef.current < 8) return;

      smoothedRef.current = {
        x: lerp(smoothedRef.current.x, 0.5, 0.08),
        openness: lerp(smoothedRef.current.openness, 0.72, 0.06),
        isPresent: false,
      };
      onStatusChange?.('lost');
      onHandUpdate(smoothedRef.current);
    };

    const predictWebcam = () => {
      if (!isActiveSession || !handLandmarkerRef.current || !videoRef.current) return;

      try {
        const result = handLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0] as Landmark[];
          const rawX = clamp01(1 - landmarks[9].x);
          const rawOpenness = getHandOpenness(landmarks);

          smoothedRef.current = {
            x: lerp(smoothedRef.current.x, rawX, SMOOTHING),
            openness: lerp(smoothedRef.current.openness, rawOpenness, SMOOTHING),
            isPresent: true,
          };
          missingFramesRef.current = 0;
          onStatusChange?.('tracking');
          onHandUpdate(smoothedRef.current);
        } else {
          publishMissingHand();
        }
      } catch (e) {
        console.warn('Prediction error:', e);
      }

      requestRef.current = requestAnimationFrame(predictWebcam);
    };

    const startCamera = async () => {
      try {
        onStatusChange?.('camera');
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30, max: 30 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (isActiveSession && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            videoRef.current?.play();
            predictWebcam();
          };
        }
      } catch (err: any) {
        console.error('Camera error:', err);
        if (!isActiveSession) return;

        onStatusChange?.('error');
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          onError?.('Camera permission was denied. Please allow camera access in the browser and try again.');
        } else {
          onError?.('Could not access the camera. Please make sure a webcam is connected and not used by another app.');
        }
      }
    };

    startCamera();

    return () => {
      isActiveSession = false;
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [active, isSetup, onError, onHandUpdate, onStatusChange]);

  return (
    <video
      ref={videoRef}
      className="pointer-events-none absolute left-0 top-0 h-full w-full object-cover opacity-0"
      autoPlay
      playsInline
      muted
    />
  );
};

export default HandController;

import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

interface HandControllerProps {
  onHandUpdate: (data: { 
    x: number;          // 0 to 1 (screen position)
    openness: number;   // 0 (fist) to 1 (open palm)
    isPresent: boolean;
  }) => void;
  active: boolean;
  onError?: (error: string) => void;
}

const HandController: React.FC<HandControllerProps> = ({ onHandUpdate, active, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const [isSetup, setIsSetup] = useState(false);

  // Initialize MediaPipe
  useEffect(() => {
    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setIsSetup(true);
      } catch (e) {
        console.error("MediaPipe Init Error:", e);
        if (onError) onError("Failed to load computer vision engine.");
      }
    };
    setupMediaPipe();
  }, [onError]);

  // Initialize Camera & Loop
  useEffect(() => {
    if (!active || !isSetup || !videoRef.current) return;

    let stream: MediaStream | null = null;
    let isActiveSession = true;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, frameRate: 30 } 
        });
        
        if (isActiveSession && videoRef.current) {
            videoRef.current.srcObject = stream;
            // Wait for data to be loaded before starting prediction loop
            videoRef.current.onloadeddata = () => {
                predictWebcam();
            };
        }
      } catch (err: any) {
        console.error("Camera Error:", err);
        if (isActiveSession && onError) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                onError("Camera permission denied. Please allow camera access.");
            } else {
                onError("Could not access camera. Please ensure it is connected.");
            }
        }
      }
    };

    startCamera();

    return () => {
        isActiveSession = false;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [active, isSetup, onError]);

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;

    const nowInMs = Date.now();
    try {
        const result = handLandmarkerRef.current.detectForVideo(videoRef.current, nowInMs);

        if (result.landmarks && result.landmarks.length > 0) {
            const landmarks = result.landmarks[0];
            
            const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
            
            const palmSize = dist(landmarks[0], landmarks[5]);
            // Safety check to avoid division by zero
            if (palmSize > 0.001) {
                const indexDist = dist(landmarks[0], landmarks[8]);
                const middleDist = dist(landmarks[0], landmarks[12]);
                const pinkyDist = dist(landmarks[0], landmarks[20]);
                
                const avgTipDist = (indexDist + middleDist + pinkyDist) / 3;
                
                let openness = (avgTipDist / palmSize - 0.8) / 1.2;
                openness = Math.max(0, Math.min(1, openness));

                const xPos = 1 - landmarks[9].x; 

                onHandUpdate({
                    x: xPos,
                    openness: openness,
                    isPresent: true
                });
            }
        } else {
            onHandUpdate({ x: 0.5, openness: 0, isPresent: false });
        }
    } catch (e) {
        console.warn("Prediction error:", e);
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <video 
      ref={videoRef} 
      className="absolute top-0 left-0 w-full h-full object-cover opacity-0 pointer-events-none" 
      autoPlay 
      playsInline 
      muted
    />
  );
};

export default HandController;
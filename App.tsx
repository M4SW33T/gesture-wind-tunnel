import React, { useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Activity, AlertTriangle, Aperture, Gauge, Hand, Power, RotateCw, Scan, Wind } from 'lucide-react';

import HandController from './components/HandController';
import ProceduralCar from './components/ProceduralCar';
import SmokeParticles from './components/SmokeParticles';

type HandData = {
  x: number;
  openness: number;
  isPresent: boolean;
};

type VisionStatus = 'idle' | 'loading' | 'ready' | 'camera' | 'tracking' | 'lost' | 'error';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatDegrees = (rotation: number) => {
  const degrees = ((rotation * 180 / Math.PI) % 360 + 360) % 360;
  return `${degrees.toFixed(0)}deg`;
};

const getGestureLabel = (handData: HandData) => {
  if (!handData.isPresent) return 'No hand';
  if (handData.openness > 0.68) return 'Open palm';
  if (handData.openness < 0.28) return 'Focused fist';
  return 'Half-open hand';
};

const RotatingStage: React.FC<{ rotation: number; handData: HandData; isActive: boolean }> = ({ rotation, handData, isActive }) => {
  const flowWidth = isActive ? (handData.isPresent ? handData.openness : 0.72) : 0;
  const windSpeed = isActive ? 17 + flowWidth * 9 : 8;

  return (
    <group rotation={[0, rotation, 0]}>
      <ProceduralCar />
      <SmokeParticles handOpenness={flowWidth} windSpeed={windSpeed} />
    </group>
  );
};

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [visionStatus, setVisionStatus] = useState<VisionStatus>('idle');
  const [handData, setHandData] = useState<HandData>({
    x: 0.5,
    openness: 0.72,
    isPresent: false,
  });
  const [rotation, setRotation] = useState(0);

  const handleHandUpdate = useCallback((data: HandData) => {
    setHandData(data);

    if (data.isPresent) {
      const offset = data.x - 0.5;
      const deadZone = 0.08;
      const intent = Math.abs(offset) < deadZone ? 0 : Math.sign(offset) * (Math.abs(offset) - deadZone);
      const speed = clamp(intent * 0.085, -0.045, 0.045);
      setRotation((prev) => prev + speed);
    } else {
      setRotation((prev) => prev + 0.0015);
    }
  }, []);

  const handleCameraError = useCallback((msg: string) => {
    setCameraError(msg);
    setIsActive(false);
    setVisionStatus('error');
  }, []);

  const handleStart = () => {
    setCameraError(null);
    setVisionStatus('loading');
    setIsActive(true);
  };

  const systemStatus = cameraError
    ? 'CAMERA ERROR'
    : isActive
      ? handData.isPresent
        ? 'TRACKING HAND'
        : visionStatus === 'loading'
          ? 'LOADING VISION'
          : 'SEARCHING HAND'
      : 'STANDBY';

  const flowWidthPercent = Math.round(handData.openness * 100);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black font-mono text-white select-none">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [5, 2, 5], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[10, 10, 5]} intensity={0.7} castShadow />
        <ContactShadows position={[0, -0.45, 0]} opacity={0.45} scale={10} blur={2} far={2.5} />
        <RotatingStage rotation={rotation} handData={handData} isActive={isActive} />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.36)_72%,rgba(0,0,0,0.88)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="pointer-events-none absolute left-0 top-0 flex w-full items-start justify-between gap-4 p-4 sm:p-6">
        <div className="max-w-[62vw]">
          <div className="mb-2 text-[10px] uppercase tracking-[0.32em] text-cyan-300 sm:text-xs">
            Gesture-driven airflow study
          </div>
          <h1 className="flex items-center gap-2 text-3xl font-black tracking-normal sm:text-5xl">
            <Wind className="h-8 w-8 text-cyan-400" />
            AERO<span className="text-cyan-400">TUNNEL</span>
          </h1>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400 sm:text-xs">
            <span className={`h-2 w-2 rounded-full ${isActive && !cameraError ? 'animate-pulse bg-green-400' : 'bg-red-500'}`} />
            {systemStatus}
          </div>
        </div>

        {isActive && (
          <div className="grid grid-cols-1 gap-2 text-right sm:grid-cols-3">
            <div className="rounded border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md">
              <div className="text-[10px] uppercase tracking-widest text-gray-400">Flow width</div>
              <div className="text-lg font-bold text-cyan-300 sm:text-xl">{flowWidthPercent}%</div>
            </div>
            <div className="rounded border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md">
              <div className="text-[10px] uppercase tracking-widest text-gray-400">Rotation</div>
              <div className="text-lg font-bold text-orange-300 sm:text-xl">{formatDegrees(rotation)}</div>
            </div>
            <div className="hidden rounded border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md sm:block">
              <div className="text-[10px] uppercase tracking-widest text-gray-400">Gesture</div>
              <div className="text-lg font-bold text-white sm:text-xl">{getGestureLabel(handData)}</div>
            </div>
          </div>
        )}
      </div>

      {isActive && (
        <div
          className="pointer-events-none absolute bottom-5 left-1/2 w-[min(680px,calc(100vw-32px))] -translate-x-1/2 transition-opacity duration-500 sm:bottom-8"
          style={{ opacity: handData.isPresent ? 1 : 0.42 }}
        >
          <div className="grid grid-cols-3 gap-3 rounded border border-white/10 bg-black/45 p-3 backdrop-blur-md">
            <div className="flex flex-col items-center gap-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                <div className="h-full bg-cyan-300 transition-all duration-150" style={{ width: `${flowWidthPercent}%` }} />
              </div>
              <span className="flex items-center gap-1 text-[10px] uppercase text-cyan-300">
                <Aperture size={12} /> Width
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="relative h-1.5 w-full rounded-full bg-gray-800">
                <div className="absolute left-1/2 top-[-3px] h-3 w-px bg-white/30" />
                <div
                  className="absolute top-0 h-full w-1.5 -translate-x-1/2 rounded-full bg-orange-300 transition-all duration-150"
                  style={{ left: `${handData.x * 100}%` }}
                />
              </div>
              <span className="flex items-center gap-1 text-[10px] uppercase text-orange-300">
                <Scan size={12} /> Turntable
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                <div className={`h-full transition-all duration-300 ${handData.isPresent ? 'w-full bg-green-300' : 'w-1/3 bg-gray-500'}`} />
              </div>
              <span className="flex items-center gap-1 text-[10px] uppercase text-green-200">
                <Hand size={12} /> {handData.isPresent ? 'Locked' : 'Searching'}
              </span>
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 p-6">
          <div className="max-w-md rounded-lg border border-red-500/50 bg-red-950/50 p-6 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-xl font-bold text-red-400">Camera access needed</h3>
            <p className="mb-6 text-sm text-gray-300">{cameraError}</p>
            <button
              onClick={() => setCameraError(null)}
              className="pointer-events-auto rounded bg-red-600 px-6 py-2 font-bold text-white transition-colors hover:bg-red-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {!isActive && !cameraError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-7 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-cyan-200">
                <Activity size={12} /> Portfolio prototype
              </div>
              <h2 className="text-3xl font-bold text-white">Virtual Wind Tunnel</h2>
              <p className="text-sm leading-6 text-gray-300">
                A playful gesture-control prototype for exploring airflow behavior around a racing car.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-left text-xs text-gray-300 sm:grid-cols-3">
              <div className="space-y-2 rounded border border-white/10 bg-white/5 p-4">
                <Aperture className="text-cyan-300" size={18} />
                <strong className="block text-white">Open palm</strong>
                Widen the airflow field.
              </div>
              <div className="space-y-2 rounded border border-white/10 bg-white/5 p-4">
                <Gauge className="text-cyan-300" size={18} />
                <strong className="block text-white">Close fist</strong>
                Focus the stream into a tighter jet.
              </div>
              <div className="space-y-2 rounded border border-white/10 bg-white/5 p-4">
                <RotateCw className="text-orange-300" size={18} />
                <strong className="block text-white">Move left/right</strong>
                Rotate the car on the virtual turntable.
              </div>
            </div>

            <button
              onClick={handleStart}
              className="pointer-events-auto group relative w-full bg-cyan-400 py-4 font-bold uppercase tracking-widest text-black transition-all hover:scale-[1.01] hover:bg-cyan-300"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              <span className="flex items-center justify-center gap-3">
                <Power className="h-5 w-5" />
                Initialize System
              </span>
            </button>
          </div>
        </div>
      )}

      <HandController
        active={isActive}
        onHandUpdate={handleHandUpdate}
        onError={handleCameraError}
        onStatusChange={setVisionStatus}
      />
    </div>
  );
};

export default App;

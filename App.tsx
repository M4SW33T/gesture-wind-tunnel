import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { Wind, Scan, Aperture, Power, AlertTriangle } from 'lucide-react';

import HandController from './components/HandController';
import ProceduralCar from './components/ProceduralCar';
import SmokeParticles from './components/SmokeParticles';
import './types';

// Create a rotating stage group to lock car and wind source together
const RotatingStage: React.FC<{ rotation: number; handData: any; isActive: boolean }> = ({ rotation, handData, isActive }) => {
    return (
        <group rotation={[0, rotation, 0]}>
             <ProceduralCar />
             <SmokeParticles 
                handOpenness={isActive ? (handData.isPresent ? handData.openness : 1.0) : 0} 
                windSpeed={20} 
            />
        </group>
    );
};

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [handData, setHandData] = useState<{ x: number; openness: number; isPresent: boolean }>({
    x: 0.5,
    openness: 1.0,
    isPresent: false
  });
  
  const [rotation, setRotation] = useState(0);

  const handleHandUpdate = useCallback((data: { x: number; openness: number; isPresent: boolean }) => {
    setHandData(data);
    
    if (data.isPresent) {
        // Map X (0-1) to Rotation Speed. Center (0.5) = 0 speed
        const speed = (data.x - 0.5) * 0.1; 
        setRotation(prev => prev + speed);
    } else {
        // Auto rotate slowly if no hand
        setRotation(prev => prev + 0.002);
    }
  }, []);

  const handleCameraError = useCallback((msg: string) => {
      setCameraError(msg);
      setIsActive(false);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-mono text-white select-none">
      
      {/* 3D Scene */}
      <Canvas shadows dpr={[1, 2]} camera={{ position: [5, 2, 5], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        
        {/* Stage handles lighting/env. adjustCamera={false} PREVENTS JITTER */}
        <Stage environment="city" intensity={0.6} adjustCamera={false}>
            <RotatingStage rotation={rotation} handData={handData} isActive={isActive} />
        </Stage>

        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
      </Canvas>

      {/* --- HUD INTERFACE --- */}
      
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
        <div>
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-2">
                <Wind className="w-8 h-8 text-cyan-400" />
                AERO<span className="text-cyan-400">TUNNEL</span>
            </h1>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {isActive ? 'SYSTEM ONLINE' : 'SYSTEM STANDBY'}
            </div>
        </div>
        
        {isActive && (
            <div className="flex flex-col gap-2 text-right">
                <div className="bg-white/5 border border-white/10 p-2 rounded backdrop-blur-md">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest">Turbulence</div>
                    <div className="text-xl font-bold text-cyan-400">{(handData.openness * 100).toFixed(0)}%</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-2 rounded backdrop-blur-md">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest">Rotation</div>
                    <div className="text-xl font-bold text-orange-400">{(rotation * 57.29 % 360).toFixed(0)}°</div>
                </div>
            </div>
        )}
      </div>

      {isActive && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 pointer-events-none transition-opacity duration-500" style={{opacity: handData.isPresent ? 1 : 0.3}}>
              <div className="flex flex-col items-center gap-2">
                  <div className={`w-16 h-1 rounded-full overflow-hidden bg-gray-800`}>
                      <div className="h-full bg-cyan-400 transition-all duration-100" style={{width: `${handData.openness * 100}%`}}></div>
                  </div>
                  <span className="text-[10px] uppercase text-cyan-400 flex items-center gap-1">
                      <Aperture size={12}/> Diffusion
                  </span>
              </div>
              
              <div className="w-px h-8 bg-gray-700"></div>

              <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-1 bg-gray-800 relative">
                       <div className="absolute top-0 w-1 h-full bg-orange-500 transition-all duration-100" style={{left: `${handData.x * 100}%`}}></div>
                  </div>
                   <span className="text-[10px] uppercase text-orange-400 flex items-center gap-1">
                      <Scan size={12}/> Rotate
                  </span>
              </div>
          </div>
      )}

      {/* Camera Error Modal */}
      {cameraError && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 p-6">
              <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg max-w-md text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-red-500 mb-2">Camera Access Error</h3>
                  <p className="text-gray-300 text-sm mb-6">{cameraError}</p>
                  <button 
                      onClick={() => setCameraError(null)}
                      className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors"
                  >
                      Dismiss
                  </button>
              </div>
          </div>
      )}

      {/* Start Screen Overlay */}
      {!isActive && !cameraError && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Virtual Wind Tunnel</h2>
                    <p className="text-gray-400 text-sm">Use hand gestures to analyze vehicle aerodynamics.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left text-xs text-gray-400 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="space-y-1">
                        <strong className="text-white block">✋ Open Palm</strong>
                        Create wide laminar flow (Diffusion)
                    </div>
                    <div className="space-y-1">
                        <strong className="text-white block">✊ Closed Fist</strong>
                        Focus stream (Concentration)
                    </div>
                    <div className="space-y-1 col-span-2 border-t border-white/10 pt-2 mt-2">
                        <strong className="text-white block">↔️ Move Hand L/R</strong>
                        Rotate vehicle turntable
                    </div>
                </div>

                <button 
                    onClick={() => setIsActive(true)}
                    className="group relative w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-widest transition-all clip-path-polygon hover:scale-[1.02]"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                >
                    <span className="flex items-center justify-center gap-3">
                        <Power className="w-5 h-5" />
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
      />

    </div>
  );
};

export default App;
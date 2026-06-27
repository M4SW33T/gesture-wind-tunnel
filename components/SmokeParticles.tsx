import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../types';

interface SmokeParticlesProps {
  handOpenness: number; // 0 to 1
  windSpeed: number;
}

const COUNT = 3000;

const SmokeParticles: React.FC<SmokeParticlesProps> = ({ handOpenness, windSpeed }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // [x, y, z, offsetTime, randomYOffset, randomXOffset]
  const particles = useMemo(() => {
    const data = new Float32Array(COUNT * 6);
    for (let i = 0; i < COUNT; i++) {
        data[i * 6 + 0] = (Math.random() - 0.5) * 3.0; // Narrower start stream
        data[i * 6 + 1] = Math.random(); 
        data[i * 6 + 2] = (Math.random() - 0.5) * 10; // Initial Z
        data[i * 6 + 3] = Math.random() * 100; // Time offset
        data[i * 6 + 4] = (Math.random() - 0.5) * 2; // Y randomness factor (-1 to 1)
        data[i * 6 + 5] = (Math.random() - 0.5) * 2; // X randomness factor
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (!mesh.current) return;

    const time = state.clock.getElapsedTime();
    const targetSpread = 0.3 + (handOpenness * 2.5); 

    // --- COLLISION CONFIGURATION ---
    // Shift the entire physics grid BACK to match visual model
    const Z_OFFSET = 1.5; 

    for (let i = 0; i < COUNT; i++) {
        const idx = i * 6;
        const offset = particles[idx + 3];
        const randY = particles[idx + 4];
        const randX = particles[idx + 5];

        // 1. Flow Calculation
        let z = 6.0 - ((time * windSpeed + offset) % 13);
        let x = randX * targetSpread * 0.5; 
        
        // Lower spawn height to hit the front wing
        let y = 0.2 + (randY + 0.5) * 0.5 * targetSpread; 
        if (y < 0.1) y = 0.1;

        // 2. F1 "Segmented" Collision Logic
        // We calculate height/width based on the particle's position relative to the car
        const localZ = z - Z_OFFSET; // Coordinate relative to car center
        
        // -- WIDTH PROFILE --
        // Nose is narrow (0.5), Sidepods are wide (0.95)
        let carWidth = 0.95;
        if (localZ > 1.0) {
            carWidth = 0.45; // Narrow Nose
        } else if (localZ > 0.0) {
            // Lerp width from Nose to Sidepods
            const t = (localZ - 0.0) / 1.0;
            carWidth = 0.95 - t * 0.5;
        }

        // -- HEIGHT PROFILE (The "Ups and Downs") --
        let carHeight = 0.0;
        
        if (localZ > 2.2) {
            // Before car
            carHeight = 0.0;
        } else if (localZ > 1.4) {
            // Front Wing Area (Low)
            carHeight = 0.35;
        } else if (localZ > 0.6) {
            // Nose Cone slope up to Cockpit
            // 1.4 -> 0.6
            const t = (localZ - 0.6) / 0.8; // 0 to 1
            carHeight = 1.15 - t * 0.8; // Ramp 1.15 down to 0.35
        } else if (localZ > -0.8) {
            // Main Cockpit / Airbox / Halo (High)
            carHeight = 1.15;
        } else if (localZ > -1.8) {
            // Engine Cover sloping down
            // -0.8 -> -1.8
            const t = (localZ + 1.8) / 1.0;
            carHeight = 0.7 + t * 0.45;
        } else if (localZ > -2.6) {
            // Rear Wing (High again)
            carHeight = 0.95;
        }

        // 3. Collision Check
        // Treat cross-section as semi-circle/ellipse
        if (Math.abs(x) < carWidth) {
            const xRatio = x / carWidth;
            // Elliptical height attenuation
            const surfaceHeight = carHeight * Math.sqrt(1.0 - xRatio * xRatio);

            // Push particle up if inside volume
            if (y < surfaceHeight) {
                // Smooth slide
                y = surfaceHeight; 

                // Add "kick" at the rear wing to simulate downforce wake
                if (localZ < -2.2 && localZ > -2.6) {
                     y += 0.05 + Math.random() * 0.05;
                }
            }
        }

        // 4. Wake Turbulence
        if (localZ < -2.6) {
             if (y > 0.8) y *= 0.96; // Drop down after car
             x += (Math.random() - 0.5) * 0.03; // Dirty air
        }

        dummy.position.set(x, y, z);
        
        let stretch = 0.9 + (1.0 - handOpenness) * 2.5; 
        dummy.scale.set(0.015, 0.015, stretch); 
        
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial 
        color="#aaddff" 
        transparent 
        opacity={0.5} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </instancedMesh>
  );
};

export default SmokeParticles;
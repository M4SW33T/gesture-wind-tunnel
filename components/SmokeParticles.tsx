import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SmokeParticlesProps {
  handOpenness: number; // 0 to 1
  windSpeed: number;
}

const COUNT = 2600;
const FLOW_LENGTH = 13;
const Z_OFFSET = 1.5;

const SmokeParticles: React.FC<SmokeParticlesProps> = ({ handOpenness, windSpeed }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // [seedX, seedY, seedZ, offsetTime, wakePhase, scaleJitter]
  const particles = useMemo(() => {
    const data = new Float32Array(COUNT * 6);
    for (let i = 0; i < COUNT; i++) {
      data[i * 6 + 0] = (Math.random() - 0.5) * 2;
      data[i * 6 + 1] = Math.random();
      data[i * 6 + 2] = Math.random();
      data[i * 6 + 3] = Math.random() * 100;
      data[i * 6 + 4] = Math.random() * Math.PI * 2;
      data[i * 6 + 5] = 0.75 + Math.random() * 0.65;
    }
    return data;
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;

    const time = state.clock.getElapsedTime();
    const targetSpread = 0.28 + handOpenness * 2.45;
    const focusStretch = 0.9 + (1 - handOpenness) * 2.5;

    for (let i = 0; i < COUNT; i++) {
      const idx = i * 6;
      const seedX = particles[idx + 0];
      const seedY = particles[idx + 1];
      const offset = particles[idx + 3];
      const wakePhase = particles[idx + 4];
      const scaleJitter = particles[idx + 5];

      let z = 6 - ((time * windSpeed + offset) % FLOW_LENGTH);
      let x = seedX * targetSpread * 0.55;
      let y = Math.max(0.08, 0.16 + seedY * 0.58 * targetSpread);

      const localZ = z - Z_OFFSET;

      let carWidth = 0.95;
      if (localZ > 1.0) {
        carWidth = 0.45;
      } else if (localZ > 0.0) {
        const t = localZ / 1.0;
        carWidth = 0.95 - t * 0.5;
      }

      let carHeight = 0.0;
      if (localZ > 2.2) {
        carHeight = 0.0;
      } else if (localZ > 1.4) {
        carHeight = 0.35;
      } else if (localZ > 0.6) {
        const t = (localZ - 0.6) / 0.8;
        carHeight = 1.15 - t * 0.8;
      } else if (localZ > -0.8) {
        carHeight = 1.15;
      } else if (localZ > -1.8) {
        const t = (localZ + 1.8) / 1.0;
        carHeight = 0.7 + t * 0.45;
      } else if (localZ > -2.6) {
        carHeight = 0.95;
      }

      if (Math.abs(x) < carWidth) {
        const xRatio = x / carWidth;
        const surfaceHeight = carHeight * Math.sqrt(1 - xRatio * xRatio);

        if (y < surfaceHeight) {
          y = surfaceHeight;
          if (localZ < -2.2 && localZ > -2.6) {
            y += 0.06 + Math.sin(time * 8 + wakePhase) * 0.025;
          }
        }
      }

      if (localZ < -2.6) {
        const wakeAmount = Math.min(1, Math.abs(localZ + 2.6) / 2);
        if (y > 0.8) y *= 0.96;
        x += Math.sin(time * 7 + wakePhase) * 0.035 * wakeAmount;
        y += Math.cos(time * 5 + wakePhase) * 0.018 * wakeAmount;
      }

      dummy.position.set(x, y, z);
      dummy.scale.set(0.014 * scaleJitter, 0.014 * scaleJitter, focusStretch * scaleJitter);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }

    mesh.current.instanceMatrix.needsUpdate = true;

    if (material.current) {
      material.current.opacity = 0.32 + handOpenness * 0.22;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial 
        ref={material}
        color="#aaddff" 
        transparent 
        opacity={0.44} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </instancedMesh>
  );
};

export default SmokeParticles;

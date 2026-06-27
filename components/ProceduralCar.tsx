import React from 'react';
import { useGLTF } from '@react-three/drei';

const ProceduralCar: React.FC = () => {
  // Load the McLaren F1 model
  const { scene } = useGLTF('/f1_2021_mclaren_mcl35m.glb');

  return (
    <primitive 
      object={scene} 
      rotation={[0, Math.PI, 0]} // Rotate 180 degrees to face forward
    />
  );
};

export default ProceduralCar;
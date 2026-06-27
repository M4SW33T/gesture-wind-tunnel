import React from 'react';
import { useGLTF } from '@react-three/drei';

const ProceduralCar: React.FC = () => {
  // Load the McLaren F1 model (use BASE_URL for GitHub Pages subdirectory support)
  const modelPath = import.meta.env.BASE_URL + 'f1_2021_mclaren_mcl35m.glb';
  const { scene } = useGLTF(modelPath);

  return (
    <primitive 
      object={scene} 
      rotation={[0, Math.PI, 0]} // Rotate 180 degrees to face forward
    />
  );
};

export default ProceduralCar;
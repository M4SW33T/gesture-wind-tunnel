import * as THREE from 'three';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResult {
  landmarks: HandLandmark[][];
  handedness: { index: number; score: number; categoryName: string; displayName: string }[][];
}

export enum GestureType {
  NONE = 'NONE',
  POINTING = 'POINTING', // Index finger extended, others curled
  OPEN_PALM = 'OPEN_PALM', // All fingers extended
  FIST = 'FIST' // All fingers curled
}

export interface SimulationState {
  isEmitting: boolean;
  emitterPosition: [number, number, number]; // x, y, z in 3D world space
  carRotation: number;
  windSpeed: number;
}

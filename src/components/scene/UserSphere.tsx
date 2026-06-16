import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  position: [number, number, number];
  color: string;
  radius?: number;
}

const UserSphere: React.FC<Props> = ({ color, radius = 0.4 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x += 0.001;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= 0.002;
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 1.5, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
};

export default UserSphere;

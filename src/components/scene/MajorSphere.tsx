import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  position: [number, number, number];
  color: string;
  name: string;
  score: number;
  radius?: number;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

const MajorSphere: React.FC<Props> = ({
  position,
  color,
  name,
  score,
  radius = 0.25,
  onClick,
  onHover,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const opacity = 0.35 + (score / 100) * 0.35;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerEnter={() => onHover?.(true)}
        onPointerLeave={() => onHover?.(false)}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.3}
          metalness={0.05}
          transparent
          opacity={opacity}
          transmission={0.4}
          thickness={0.5}
        />
      </mesh>
      <Text
        position={[position[0], position[1] + radius + 0.2, position[2]]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="bottom"
        maxWidth={1.5}
      >
        {name}
      </Text>
    </group>
  );
};

export default MajorSphere;

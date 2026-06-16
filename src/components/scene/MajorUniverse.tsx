import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import UserSphere from './UserSphere';
import MajorSphere from './MajorSphere';
import { Major } from '../../types';

interface Props {
  majors: { major: Major; score: number }[];
  profileKeywords: string[];
  onMajorClick?: (major: Major) => void;
}

function fibonacciSphere(n: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    points.push([Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius]);
  }
  return points;
}

function MajorCloud({ majors, onMajorClick }: { majors: { major: Major; score: number }[]; onMajorClick?: (major: Major) => void }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005;
    }
  });

  const positions = useMemo(() => {
    const top = majors.slice(0, 15);
    return fibonacciSphere(top.length, 3.5).map((pos, i) => {
      const d = 1 - top[i].score / 100;
      return [pos[0] * (0.6 + d * 1.2), pos[1] * (0.6 + d * 1.2), pos[2] * (0.6 + d * 1.2)] as [number, number, number];
    });
  }, [majors]);

  const top = majors.slice(0, 15);

  return (
    <group ref={groupRef}>
      {top.map((m, i) => (
        <MajorSphere
          key={m.major.major_name}
          position={positions[i]}
          color={m.major.color}
          name={m.major.major_name}
          score={m.score}
          onClick={() => onMajorClick?.(m.major)}
        />
      ))}
    </group>
  );
}

const MajorUniverse: React.FC<Props> = ({ majors, onMajorClick }) => {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-black/60 backdrop-blur-sm border border-white/10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
          <pointLight position={[-5, -3, -5]} intensity={0.5} color="#4f46e5" />
          <Stars radius={20} depth={50} count={800} factor={4} saturation={0} fade speed={0.5} />
          <Environment preset="city" />
          <UserSphere position={[0, 0, 0]} color="#f59e0b" radius={0.35} />
          <MajorCloud majors={majors} onMajorClick={onMajorClick} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={4}
            maxDistance={12}
            maxPolarAngle={Math.PI * 0.8}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default MajorUniverse;

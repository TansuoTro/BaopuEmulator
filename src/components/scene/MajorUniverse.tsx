import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import UserSphere from './UserSphere';
import MajorSphere from './MajorSphere';
import { Major } from '../../types';

interface Props {
  majors: { major: Major; score: number }[];
  onMajorClick?: (major: Major) => void;
}

function ringPositions(n: number, radius: number, angleOffset = 0): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + angleOffset;
    pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
  }
  return pts;
}

function spiralPositions(n: number, baseRadius: number, height: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1 || 1);
    const angle = t * Math.PI * 4;
    const r = baseRadius + t * 0.5;
    const y = (t - 0.5) * height;
    pts.push([Math.cos(angle) * r, y, Math.sin(angle) * r]);
  }
  return pts;
}

function MajorCloud({ majors, onMajorClick }: {
  majors: { major: Major; score: number }[];
  onMajorClick?: (major: Major) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0003;
  });

  const sorted = useMemo(() => [...majors].sort((a, b) => b.score - a.score).slice(0, 15), [majors]);

  const positions = useMemo(() => {
    const inner: { major: Major; score: number }[] = [];
    const mid: { major: Major; score: number }[] = [];
    const outer: { major: Major; score: number }[] = [];

    for (const m of sorted) {
      if (m.score >= 75) inner.push(m);
      else if (m.score >= 55) mid.push(m);
      else outer.push(m);
    }

    const result: { pos: [number, number, number]; major: Major; score: number }[] = [];

    const innerRings = ringPositions(Math.max(inner.length, 1), 1.5);
    inner.forEach((m, i) => result.push({ pos: innerRings[i % innerRings.length], ...m }));

    const midSpiral = spiralPositions(Math.max(mid.length, 1), 2.5, 1.8);
    mid.forEach((m, i) => result.push({ pos: midSpiral[i % midSpiral.length], ...m }));

    const outerSpiral = spiralPositions(Math.max(outer.length, 1), 4.0, 2.5);
    outer.forEach((m, i) => result.push({ pos: outerSpiral[i % outerSpiral.length], ...m }));

    return result;
  }, [sorted]);

  return (
    <group ref={groupRef}>
      {positions.map((item) => (
        <MajorSphere
          key={item.major.major_name}
          position={item.pos}
          color={item.major.color}
          name={item.major.major_name}
          score={item.score}
          onClick={() => onMajorClick?.(item.major)}
        />
      ))}
    </group>
  );
}

const MajorUniverse: React.FC<Props> = ({ majors, onMajorClick }) => {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-white/10" style={{ background: '#0a0a1a' }}>
      <Canvas
        camera={{ position: [0, 2.5, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <pointLight position={[8, 8, 8]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-5, -3, -5]} intensity={0.4} color="#4f46e5" />
          <pointLight position={[0, 0, 0]} intensity={0.8} color="#f59e0b" />
          <Stars radius={25} depth={60} count={600} factor={4} saturation={0} fade speed={0.3} />
          <Environment preset="night" />
          <UserSphere position={[0, 0, 0]} color="#f59e0b" radius={0.3} />
          <MajorCloud majors={majors} onMajorClick={onMajorClick} />
          <OrbitControls enableDamping dampingFactor={0.05} minDistance={3} maxDistance={12} maxPolarAngle={Math.PI * 0.75} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default MajorUniverse;

import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { UserProfile, Major } from '../../types';

interface Props {
  profile: UserProfile;
  topMajors: { major: Major; score: number }[];
}

const DIMS: { key: keyof UserProfile; label: string; axis: [number, number, number] }[] = [
  { key: 'math', label: '数学', axis: [1, 0, 0] },
  { key: 'logic', label: '逻辑', axis: [0, 1, 0] },
  { key: 'social', label: '社交', axis: [0, 0, 1] },
  { key: 'language', label: '语言', axis: [-1, 0, 0] },
  { key: 'creativity', label: '创造', axis: [0, -1, 0] },
  { key: 'pressure_tolerance', label: '抗压', axis: [0, 0, -1] },
];

function norm(v: number): number {
  return (v - 50) / 50;
}

function getPosition(profile: UserProfile): [number, number, number] {
  let x = 0, y = 0, z = 0;
  for (const d of DIMS) {
    const n = norm(profile[d.key]);
    x += d.axis[0] * n * 2;
    y += d.axis[1] * n * 2;
    z += d.axis[2] * n * 2;
  }
  return [x, y, z];
}

function abilityPos(p: UserProfile, dims: { key: keyof UserProfile; axis: [number, number, number] }[]): [number, number, number][] {
  return dims.map((d) => {
    const n = norm(p[d.key]);
    return [d.axis[0] * n * 2, d.axis[1] * n * 2, d.axis[2] * n * 2] as [number, number, number];
  });
}

function ScatterScene({ profile, topMajors }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const userPos = getPosition(profile);

  const majorData = useMemo(() => {
    return topMajors.slice(0, 8).map((m) => ({
      pos: getPosition(m.major.profile_vector as UserProfile),
      color: m.major.color,
      name: m.major.major_name,
      score: m.score,
    }));
  }, [topMajors]);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.002;
  });

  return (
    <group ref={groupRef}>
      {/* Axes */}
      {DIMS.map((d, i) => {
        const end: [number, number, number] = [d.axis[0] * 2.5, d.axis[1] * 2.5, d.axis[2] * 2.5];
        return (
          <group key={i}>
            <Line points={[[0, 0, 0], end]} color="white" lineWidth={0.3} opacity={0.15} transparent />
            <Text position={[end[0] * 1.2, end[1] * 1.2, end[2] * 1.2]} fontSize={0.18} color="rgba(255,255,255,0.4)">
              {d.label}
            </Text>
          </group>
        );
      })}

      {/* Reference grid - wireframe sphere */}
      <mesh>
        <sphereGeometry args={[2.5, 24, 24]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.05} />
      </mesh>

      {/* User point + glow */}
      <mesh position={userPos}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={userPos}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.12} />
      </mesh>
      <Text position={[userPos[0], userPos[1] + 0.3, userPos[2]]} fontSize={0.16} color="#fbbf24">
        你
      </Text>

      {/* Ability dimension points */}
      {abilityPos(profile, DIMS).map((pos, i) => (
        <mesh key={`a-${i}`} position={pos}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color={`hsl(${i * 60}, 70%, 60%)`} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Major points + connecting lines */}
      {majorData.map((m) => (
        <group key={m.name}>
          <Line
            points={[userPos, m.pos]}
            color={m.color}
            lineWidth={0.5}
            transparent
            opacity={Math.max(0.2, m.score / 100)}
          />
          <mesh position={m.pos}>
            <sphereGeometry args={[0.08 + (m.score / 100) * 0.06, 16, 16]} />
            <meshBasicMaterial color={m.color} />
          </mesh>
          <Text
            position={[m.pos[0], m.pos[1] + 0.22, m.pos[2]]}
            fontSize={0.1}
            color="rgba(255,255,255,0.5)"
            anchorX="center"
          >
            {m.name.length > 6 ? m.name.slice(0, 6) + '…' : m.name}
          </Text>
        </group>
      ))}
    </group>
  );
}

const AbilityScatter3D: React.FC<Props> = (props) => {
  return (
    <div className="w-full h-72 sm:h-80 lg:h-96 rounded-xl overflow-hidden border border-white/10" style={{ background: '#0a0a1a' }}>
      <Canvas camera={{ position: [3, 2.5, 5], fov: 45 }} gl={{ antialias: true, alpha: false }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} intensity={0.6} />
          <ScatterScene {...props} />
          <OrbitControls enableDamping dampingFactor={0.08} minDistance={3} maxDistance={10} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default AbilityScatter3D;

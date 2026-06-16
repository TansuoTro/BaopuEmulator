import { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MajorNode } from '../../types';

interface Props {
  majors: { major: MajorNode; cosine_score: number }[];
  onMajorClick?: (m: MajorNode) => void;
}

function fibonacciSphere(n: number, radius: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1 || 1)) * 2;
    const rAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push([Math.cos(theta) * rAtY * radius, y * radius, Math.sin(theta) * rAtY * radius]);
  }
  return pts;
}

function MajorCloud({ majors, onMajorClick }: { majors: { major: MajorNode; cosine_score: number }[]; onMajorClick?: (m: MajorNode) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => { if (groupRef.current) groupRef.current.rotation.y += 0.0004; });

  const sorted = useMemo(() => [...majors].sort((a,b)=>b.cosine_score-a.cosine_score).slice(0,44), [majors]);

  /* Percentile-based shell assignment: top 1/3 inner, mid 1/3 middle, bottom 1/3 outer */
  const { inner, mid, outer } = useMemo(() => {
    const i: typeof sorted = [], m: typeof sorted = [], o: typeof sorted = [];
    const n = sorted.length;
    for (let idx = 0; idx < n; idx++) {
      const tier = idx < n / 3 ? 'inner' : idx < (2 * n) / 3 ? 'mid' : 'outer';
      if (tier === 'inner') i.push(sorted[idx]);
      else if (tier === 'mid') m.push(sorted[idx]);
      else o.push(sorted[idx]);
    }
    return { inner: i, mid: m, outer: o };
  }, [sorted]);

  const innerPts = useMemo(() => fibonacciSphere(Math.max(inner.length, 1), 1.8), [inner.length]);
  const midPts = useMemo(() => fibonacciSphere(Math.max(mid.length, 1), 3.5), [mid.length]);
  const outerPts = useMemo(() => fibonacciSphere(Math.max(outer.length, 1), 5.5), [outer.length]);

  const items = useMemo(() => {
    const all: { pos: [number,number,number]; m: typeof sorted[0] }[] = [];
    inner.forEach((m, i) => all.push({ pos: innerPts[i % innerPts.length], m }));
    mid.forEach((m, i) => all.push({ pos: midPts[i % midPts.length], m }));
    outer.forEach((m, i) => all.push({ pos: outerPts[i % outerPts.length], m }));
    return all;
  }, [inner, mid, outer, innerPts, midPts, outerPts]);

  return (
    <group ref={groupRef}>
      {items.map(({ pos, m }) => {
        const r = 0.1 + (m.cosine_score / 100) * 0.12;
        return (
          <group key={m.major.id}>
            <mesh position={pos}
              onClick={e => { e.stopPropagation(); onMajorClick?.(m.major); }}>
              <sphereGeometry args={[r, 28, 28]} />
              <meshPhysicalMaterial
                color={new THREE.Color(m.major.rgb[0] / 255, m.major.rgb[1] / 255, m.major.rgb[2] / 255)}
                roughness={0.25} metalness={0.05} transparent
                opacity={0.35 + m.cosine_score / 200}
              />
            </mesh>
            <Text position={[pos[0], pos[1] + r + 0.22, pos[2]]} fontSize={0.08}
              color="rgba(255,255,255,0.5)" anchorX="center" maxWidth={2}>
              {m.major.name.length > 8 ? m.major.name.slice(0, 8) + '…' : m.major.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function UserGlow() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(s=>{if(ref.current){const sc=1+Math.sin(s.clock.elapsedTime*2.5)*0.06;ref.current.scale.setScalar(sc);}});
  return (
    <>
      <mesh><sphereGeometry args={[0.3,48,48]} /><meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} roughness={0.1} /></mesh>
      <mesh ref={ref}><sphereGeometry args={[0.55,32,32]} /><meshBasicMaterial color="#fbbf24" transparent opacity={0.08} /></mesh>
      <Text position={[0,0.7,0]} fontSize={0.14} color="#fbbf24">你</Text>
    </>
  );
}

const UniverseScene = ({ majors, onMajorClick }: Props) => {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-white/10" style={{background:'#080816'}}>
      <Canvas camera={{position:[0,2,7],fov:50}} gl={{antialias:true}}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[5,5,5]} intensity={0.8} />
          <pointLight position={[-3,-2,-3]} intensity={0.3} color="#6366f1" />
          <Stars radius={30} depth={50} count={500} factor={3} saturation={0} fade speed={0.2} />
          <UserGlow />
          <MajorCloud majors={majors} onMajorClick={onMajorClick} />
          <OrbitControls enableDamping dampingFactor={0.05} minDistance={3} maxDistance={14} maxPolarAngle={Math.PI*0.75} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default UniverseScene;

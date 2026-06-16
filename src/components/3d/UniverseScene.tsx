import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MajorNode } from '../../types';

interface Props {
  majors: { major: MajorNode; cosine_score: number }[];
  onMajorClick?: (m: MajorNode) => void;
}

function MajorCloud({ majors, onMajorClick }: { majors: { major: MajorNode; cosine_score: number }[]; onMajorClick?: (m: MajorNode) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => { if (groupRef.current) groupRef.current.rotation.y += 0.0004; });

  const sorted = useMemo(() => [...majors].sort((a,b)=>b.cosine_score-a.cosine_score).slice(0,25), [majors]);

  return (
    <group ref={groupRef}>
      {sorted.map((m) => {
        const pos = m.major.pca3d;
        const scale = 1 + m.cosine_score/200;
        const r = 0.12 + (m.cosine_score/100)*0.1;
        return (
          <group key={m.major.id}>
            <mesh position={[pos[0]*scale*4, pos[1]*scale*3, pos[2]*scale*4]}
              onClick={e=>{e.stopPropagation();onMajorClick?.(m.major);}}>
              <sphereGeometry args={[r,24,24]} />
              <meshPhysicalMaterial color={new THREE.Color(m.major.rgb[0]/255,m.major.rgb[1]/255,m.major.rgb[2]/255)} roughness={0.3} metalness={0.05} transparent opacity={0.45+m.cosine_score/200} />
            </mesh>
            <Text position={[pos[0]*scale*4,pos[1]*scale*3+r+0.25,pos[2]*scale*4]} fontSize={0.08} color="rgba(255,255,255,0.55)" anchorX="center" maxWidth={2}>
              {m.major.name.length>8?m.major.name.slice(0,8)+'…':m.major.name}
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

const UniverseScene: React.FC<Props> = ({ majors, onMajorClick }) => {
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

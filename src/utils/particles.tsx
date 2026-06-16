import { useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number; y: number;
  color: string;
  size: number;
}

let nextId = 0;

export function useClickParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const spawn = useCallback((e: React.MouseEvent) => {
    const colors = ['#818cf8','#c084fc','#f472b6','#fbbf24','#34d399','#60a5fa'];
    const newP: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      newP.push({
        id: nextId++,
        x: e.clientX + (Math.random() - 0.5) * 40,
        y: e.clientY + (Math.random() - 0.5) * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
      });
    }
    setParticles(prev => [...prev, ...newP]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newP.find(np => np.id === p.id)));
    }, 700);
  }, []);

  const Particles = () => (
    <>
      {particles.map(p => (
        <div key={p.id} className="click-particle" style={{
          left: p.x, top: p.y,
          width: p.size, height: p.size,
          background: p.color,
        }} />
      ))}
    </>
  );

  return { spawn, Particles };
}

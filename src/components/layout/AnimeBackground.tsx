import { useEffect, useState } from 'react';

const GRADIENTS = [
  'from-pink-900/40 via-purple-900/40 to-indigo-900/40',
  'from-cyan-900/40 via-blue-900/40 to-pink-900/40',
  'from-violet-900/40 via-rose-900/40 to-cyan-900/40',
  'from-indigo-900/40 via-fuchsia-900/40 to-sky-900/40',
  'from-rose-900/40 via-violet-900/40 to-teal-900/40',
];

const AnimeBackground = () => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % GRADIENTS.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[idx]} transition-all duration-[3000ms] ease-in-out`} />

      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: i % 3 === 0 ? '#c084fc' : i % 3 === 1 ? '#f9a8d4' : '#818cf8',
              animationDuration: `${8 + Math.random() * 12}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.3 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>

      {/* Grid lines overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/60" />
    </div>
  );
};

export default AnimeBackground;

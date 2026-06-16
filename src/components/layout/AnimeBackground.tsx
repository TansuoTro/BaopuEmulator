import { useEffect, useState } from 'react';

const API = 'https://t.alcy.cc/moez';

const AnimeBackground = () => {
  const [img, setImg] = useState('');
  const [next, setNext] = useState('');
  const [fade, setFade] = useState(false);

  const load = () => {
    const suffix = '?t=' + Date.now();
    setNext(API + suffix);
  };

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!next) return;
    const i = new Image();
    i.onload = () => { setFade(true); setTimeout(() => { setImg(next); setFade(false); }, 600); };
    i.src = next;
    i.crossOrigin = 'anonymous';
  }, [next]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {img && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
          style={{ backgroundImage: `url(${img})`, opacity: fade ? 0 : 1 }}
        />
      )}
      <div className="absolute inset-0 bg-black/75" />
    </div>
  );
};

export default AnimeBackground;

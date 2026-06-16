import { useEffect, useState } from 'react';

const API = 'https://t.alcy.cc/moez';

const AnimeBackground = () => {
  const [current, setCurrent] = useState('');
  const [nextUrl, setNextUrl] = useState('');
  const [fadeOut, setFadeOut] = useState(false);

  const fetchNew = () => setNextUrl(API + '?t=' + Date.now());

  useEffect(() => { fetchNew(); const t = setInterval(fetchNew, 8000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!nextUrl) return;
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      setFadeOut(true);
      setTimeout(() => { setCurrent(nextUrl); setFadeOut(false); }, 800);
    };
    img.onerror = () => { fetchNew(); };
    img.src = nextUrl;
  }, [nextUrl]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {current && (
        <img
          src={current}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
          alt=""
        />
      )}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
    </div>
  );
};

export default AnimeBackground;

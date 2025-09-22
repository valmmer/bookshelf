// src/components/fx/MeteorShower.tsx
'use client';

import { useEffect, useState } from 'react';

export default function MeteorShower() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 🔥 Configuramos 4 meteoros fixos (posição + atraso diferentes)
  const meteors = [
    { left: '10vw', top: '0vh', delay: 0 },
    { left: '60vw', top: '-20vh', delay: 3 },
    { left: '30vw', top: '-40vh', delay: 6 },
    { left: '80vw', top: '-10vh', delay: 9 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {meteors.map((m, i) => (
        <span
          key={i}
          className="absolute block will-change-transform"
          style={{
            left: m.left,
            top: m.top,
            width: '120px',
            height: '2px',
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0))',
            borderRadius: '2px',
            filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.5))',
            transform: 'rotate(-45deg)',
            animation: `meteorFall 8s linear ${m.delay}s infinite`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes meteorFall {
          0% {
            transform: translate(0, 0) rotate(-45deg);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translate(-120vw, 120vh) rotate(-45deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

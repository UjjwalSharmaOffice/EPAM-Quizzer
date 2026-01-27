import { useEffect, useState } from 'react';
import './NeonOrbs.css';

export function NeonOrbs() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="neon-orbs-container">
      {/* Top-left orb */}
      <div
        className={`neon-orb neon-orb-1 ${mounted ? 'mounted' : ''}`}
      >
        <div className="orb-light">
          <div className="beam-container beam-spin-8">
            <div className="beam-light" />
          </div>
        </div>
      </div>

      {/* Bottom-center orb */}
      <div
        className={`neon-orb neon-orb-2 ${mounted ? 'mounted' : ''}`}
      >
        <div className="orb-light">
          <div className="beam-container beam-spin-10-reverse">
            <div className="beam-light" />
          </div>
        </div>
      </div>

      {/* Top-right orb */}
      <div
        className={`neon-orb neon-orb-3 ${mounted ? 'mounted' : ''}`}
      >
        <div className="orb-light">
          <div className="beam-container beam-spin-6">
            <div className="beam-light" />
          </div>
        </div>
      </div>

      {/* Bottom-right orb */}
      <div
        className={`neon-orb neon-orb-4 ${mounted ? 'mounted' : ''}`}
      >
        <div className="orb-light">
          <div className="beam-container beam-spin-7-reverse">
            <div className="beam-light" />
          </div>
        </div>
      </div>
    </div>
  );
}

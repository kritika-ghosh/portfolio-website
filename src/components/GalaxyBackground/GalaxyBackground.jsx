import { useEffect, useRef } from 'react';
import './GalaxyBackground.css';

/**
 * Renders a pure deep-space nebula background — NO stars.
 * Stars only appear as particles explode during the disintegration phase.
 */
const GalaxyBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;

      ctx.clearRect(0, 0, W, H);

      // ── Nebula clouds ───────────────────────────────────────────────
      const nebulae = [
        { x: W * 0.18, y: H * 0.22, r: W * 0.45, color: 'rgba(45,10,120,0.28)' },
        { x: W * 0.78, y: H * 0.65, r: W * 0.40, color: 'rgba(8,50,130,0.22)' },
        { x: W * 0.55, y: H * 0.15, r: W * 0.30, color: 'rgba(0,80,110,0.18)' },
        { x: W * 0.35, y: H * 0.80, r: W * 0.35, color: 'rgba(60,0,90,0.15)'  },
        { x: W * 0.88, y: H * 0.30, r: W * 0.28, color: 'rgba(10,70,100,0.14)'},
      ];

      nebulae.forEach(({ x, y, r, color }) => {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });

      // Stars intentionally omitted — they emerge from particle disintegration only.
    };

    draw();

    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="galaxy-background">
      <canvas ref={canvasRef} className="galaxy-stars" />
    </div>
  );
};

export default GalaxyBackground;

import { useEffect, useRef, useState } from 'react';
import GalaxyBackground from '../GalaxyBackground/GalaxyBackground';
import LogoParticles    from '../LogoParticles/LogoParticles';
import './SplashScreen.css';

/**
 * Phase timeline:
 *
 *  0 ms ──────── 2 800 ms ──────────────── 7 800 ms ────── 10 000 ms ── done
 *  │  assembling  │       stable (5 s)     │ disintegrating │
 *
 * The overlay then CSS-transitions to opacity 0 over 600 ms before onComplete fires.
 */
const PHASES = {
  ASSEMBLING:    'assembling',
  STABLE:        'stable',
  DISINTEGRATING:'disintegrating',
};

const ASSEMBLE_MS    = 2800;
const STABLE_MS      = 5000;
const DISINTEGRATE_MS= 2200;
const FADE_OUT_MS    = 700;

const SplashScreen = ({ onComplete }) => {
  const [phase,    setPhase]    = useState(PHASES.ASSEMBLING);
  const [fadeOut,  setFadeOut]  = useState(false);
  const timersRef  = useRef([]);

  const addTimer = (fn, delay) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  };

  useEffect(() => {
    // ── Assembling → Stable ──────────────────────────────────────────
    addTimer(() => setPhase(PHASES.STABLE), ASSEMBLE_MS);

    // ── Stable → Disintegrating ──────────────────────────────────────
    addTimer(() => setPhase(PHASES.DISINTEGRATING), ASSEMBLE_MS + STABLE_MS);

    // ── Start CSS fade-out during disintegration ──────────────────────
    addTimer(() => setFadeOut(true), ASSEMBLE_MS + STABLE_MS + DISINTEGRATE_MS * 0.55);

    // ── Signal parent to unmount splash ──────────────────────────────
    addTimer(() => {
      if (onComplete) onComplete();
    }, ASSEMBLE_MS + STABLE_MS + DISINTEGRATE_MS + FADE_OUT_MS);

    return () => timersRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`splash-screen${fadeOut ? ' splash-screen--fade-out' : ''}`}>
      {/* Layered galaxy background */}
      <GalaxyBackground />

      {/* Phase label (subtle, for UX feedback) */}
      <div className={`splash-phase-label splash-phase-label--${phase}`}>
        {phase === PHASES.ASSEMBLING    && <span>Assembling…</span>}
        {phase === PHASES.STABLE        && <span className="splash-logo-text">◈</span>}
        {phase === PHASES.DISINTEGRATING && null}
      </div>

      {/* The particle logo canvas — takes the full overlay */}
      <LogoParticles
        imageSrc="/icon1.png"
        phase={phase}
        particleCount={3500}
        particleBaseSize={105}
        sizeRandomness={0.65}
        cameraDistance={20}
      />
    </div>
  );
};

export default SplashScreen;

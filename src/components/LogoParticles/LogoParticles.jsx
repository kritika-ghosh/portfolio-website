import { useEffect, useRef } from 'react';
import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl';
import { extractLogoCoords } from '../../utils/imageToCoords';
import './LogoParticles.css';

// ─── Timing constants ────────────────────────────────────────────────────────
const ASSEMBLE_DURATION = 2800;   // ms – particles fly into logo shape
const EXPLODE_DURATION  = 2200;   // ms – particles burst outward

// ─── Vertex Shader ───────────────────────────────────────────────────────────
const vertex = /* glsl */ `
  precision highp float;

  attribute vec3 position;        /* random start position in world space  */
  attribute vec3 targetPosition;  /* sampled logo coordinate               */
  attribute vec4 random;          /* 4 independent [0,1] random values     */
  attribute vec3 velocity;        /* unit explosion direction + magnitude  */

  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;

  uniform float uTime;
  uniform float uPhase;            /* 0 = assembling, 1 = stable, 2 = disintegrating */
  uniform float uAssembleProgress; /* 0 → 1 */
  uniform float uExplodeProgress;  /* 0 → 1 */
  uniform float uBaseSize;
  uniform float uSizeRandomness;

  varying float vAlpha;

  /* Quintic smootherstep – smoother than smoothstep */
  float smootherStep(float t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  void main() {
    vec3  pos   = vec3(0.0);
    float alpha = 1.0;
    float size  = uBaseSize;

    /* ── Phase 0 : ASSEMBLING ─────────────────────────────────────── */
    if (uPhase < 0.5) {
      /* Per-particle staggered delay so they arrive at slightly different times */
      float delay  = random.x * 0.38;
      float rawT   = clamp((uAssembleProgress - delay) / (1.0 - delay), 0.0, 1.0);
      float eased  = smootherStep(rawT);

      /* Interpolate from chaotic start → logo target */
      pos = mix(position, targetPosition, eased);

      /* Turbulence that fades to zero as particle locks onto target */
      float turb = (1.0 - eased) * 0.45;
      pos.x += sin(uTime * 3.2 + random.z * 6.28318) * turb;
      pos.y += cos(uTime * 2.7 + random.w * 6.28318) * turb;
      pos.z += sin(uTime * 2.1 + random.y * 6.28318) * turb * 0.4;

      /* Fade in – reaches full opacity in first third of travel */
      alpha = smootherStep(min(1.0, rawT * 2.8));
      size  = uBaseSize * (0.5 + 0.5 * eased);

    /* ── Phase 1 : STABLE ─────────────────────────────────────────── */
    } else if (uPhase < 1.5) {
      pos = targetPosition;
      /* Gentle breathing micro-animation */
      pos.x += sin(uTime * 0.65 + random.z * 6.28318) * 0.013;
      pos.y += cos(uTime * 0.50 + random.w * 6.28318) * 0.013;
      pos.z += sin(uTime * 0.40 + random.y * 6.28318) * 0.006;
      alpha  = 1.0;

    /* ── Phase 2 : DISINTEGRATING ─────────────────────────────────── */
    } else {
      /* Quadratic acceleration – slow start then rapid explosion */
      float e2 = uExplodeProgress * uExplodeProgress;
      float e4 = e2 * e2;

      pos  = targetPosition + velocity * e4 * 14.0;
      pos.z += (random.y - 0.3) * e2 * 9.0; /* depth scatter = star-field */

      alpha = max(0.0, 1.0 - pow(uExplodeProgress, 0.65));
      /* Particles grow as they accelerate away (like receding stars) */
      size  = uBaseSize * (0.9 + e2 * 2.8);
    }

    /* ── Size with per-particle variation ─────────────────────────── */
    vec4 mvPos  = viewMatrix * vec4(pos, 1.0);
    float sizeV = (uSizeRandomness > 0.0)
                    ? (0.55 + random.x * uSizeRandomness)
                    : 1.0;
    gl_PointSize = max(1.0, size * sizeV / length(mvPos.xyz));
    gl_Position  = projectionMatrix * mvPos;

    vAlpha = alpha;
  }
`;

// ─── Fragment Shader ─────────────────────────────────────────────────────────
const fragment = /* glsl */ `
  precision highp float;

  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.005) discard;

    vec2  uv = gl_PointCoord.xy - vec2(0.5);
    float d  = length(uv);

    if (d > 0.5) discard;

    /* Soft outer edge */
    float circle = 1.0 - smoothstep(0.32, 0.50, d);
    /* Bright core */
    float core   = 1.0 - smoothstep(0.00, 0.18, d);
    /* Diffuse halo – subtle blue-white tint */
    float halo   = exp(-d * d * 10.0) * 0.35;

    vec3  col    = mix(vec3(0.82, 0.92, 1.00), vec3(1.0), core);
    float a      = (circle + halo) * vAlpha;

    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────
const LogoParticles = ({
  imageSrc,
  phase = 'assembling',
  particleCount   = 3500,
  particleBaseSize = 100,
  sizeRandomness  = 0.7,
  cameraDistance  = 20,
}) => {
  const containerRef   = useRef(null);
  // Refs let the animation loop read the latest values without re-initialising OGL
  const phaseRef       = useRef(phase);
  const phaseStartRef  = useRef(null); // set when OGL init completes

  /* Sync phase prop → ref + reset phase timer */
  useEffect(() => {
    if (phaseRef.current !== phase) {
      phaseRef.current      = phase;
      phaseStartRef.current = performance.now();
    }
  }, [phase]);

  /* One-time OGL setup (re-runs only if core props change) */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanupFn = () => {};

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    const init = async () => {
      // ── 1. Sample logo image ──────────────────────────────────────
      let logoCoords;
      try {
        logoCoords = await extractLogoCoords(imageSrc, {
          sampleSize: 320,
          stride:     3,
          threshold:  110,
          scale:      2.6,
          maxPoints:  5000,
        });
      } catch (err) {
        console.error('[LogoParticles] Image load failed:', err);
        return;
      }

      const numLogoPoints = logoCoords.length / 3;
      const count         = particleCount;

      // ── 2. Renderer ───────────────────────────────────────────────
      const renderer = new Renderer({ dpr: pixelRatio, depth: false, alpha: true });
      const gl       = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      container.appendChild(gl.canvas);

      const camera = new Camera(gl, { fov: 15 });
      camera.position.set(0, 0, cameraDistance);

      const resize = () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
      };
      window.addEventListener('resize', resize);
      resize();

      // ── 3. Build particle attribute arrays ────────────────────────
      const positions      = new Float32Array(count * 3);
      const targetPositions = new Float32Array(count * 3);
      const velocities     = new Float32Array(count * 3);
      const randoms        = new Float32Array(count * 4);

      for (let i = 0; i < count; i++) {
        // Random start position: points on a large sphere shell
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const r     = 9 + Math.random() * 9;
        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        // Target position from sampled logo coords (cycle if more particles than coords)
        const ci = (i % numLogoPoints) * 3;
        const tx = logoCoords[ci];
        const ty = logoCoords[ci + 1];
        const tz = logoCoords[ci + 2];
        targetPositions[i * 3]     = tx;
        targetPositions[i * 3 + 1] = ty;
        targetPositions[i * 3 + 2] = tz;

        // Explosion velocity: mostly outward from logo center + random lateral spread
        const len  = Math.sqrt(tx * tx + ty * ty + 0.001);
        const nx   = tx / len;
        const ny   = ty / len;
        const mag  = 0.6 + Math.random() * 1.8;
        velocities[i * 3]     = (nx * 0.65 + (Math.random() - 0.5) * 0.9) * mag;
        velocities[i * 3 + 1] = (ny * 0.65 + (Math.random() - 0.5) * 0.9) * mag;
        velocities[i * 3 + 2] = (Math.random() - 0.35) * 2.5 * mag;

        randoms[i * 4]     = Math.random();
        randoms[i * 4 + 1] = Math.random();
        randoms[i * 4 + 2] = Math.random();
        randoms[i * 4 + 3] = Math.random();
      }

      // ── 4. OGL Geometry & Program ─────────────────────────────────
      const geometry = new Geometry(gl, {
        position:       { size: 3, data: positions },
        targetPosition: { size: 3, data: targetPositions },
        velocity:       { size: 3, data: velocities },
        random:         { size: 4, data: randoms },
      });

      const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uTime:            { value: 0 },
          uPhase:           { value: 0 },
          uAssembleProgress:{ value: 0 },
          uExplodeProgress: { value: 0 },
          uBaseSize:        { value: particleBaseSize * pixelRatio },
          uSizeRandomness:  { value: sizeRandomness },
        },
        transparent: true,
        depthTest:   false,
      });

      const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });

      // ── 5. Animation loop ─────────────────────────────────────────
      // Reset the phase start time NOW (after async image load), ensuring
      // the assembling phase gets its full ASSEMBLE_DURATION milliseconds.
      phaseStartRef.current = performance.now();
      const startTime       = performance.now();

      let animFrameId;

      const update = (t) => {
        animFrameId = requestAnimationFrame(update);

        program.uniforms.uTime.value = (t - startTime) * 0.001;

        const currentPhase  = phaseRef.current;
        const phaseElapsed  = phaseStartRef.current !== null
          ? t - phaseStartRef.current
          : 0;

        if (currentPhase === 'assembling') {
          program.uniforms.uPhase.value            = 0;
          program.uniforms.uAssembleProgress.value = Math.min(1, phaseElapsed / ASSEMBLE_DURATION);
          program.uniforms.uExplodeProgress.value  = 0;
        } else if (currentPhase === 'stable') {
          program.uniforms.uPhase.value            = 1;
          program.uniforms.uAssembleProgress.value = 1;
          program.uniforms.uExplodeProgress.value  = 0;
        } else if (currentPhase === 'disintegrating') {
          program.uniforms.uPhase.value            = 2;
          program.uniforms.uAssembleProgress.value = 1;
          program.uniforms.uExplodeProgress.value  = Math.min(1, phaseElapsed / EXPLODE_DURATION);
        }

        renderer.render({ scene: mesh, camera });
      };

      animFrameId = requestAnimationFrame(update);

      cleanupFn = () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animFrameId);
        if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      };
    };

    init();
    return () => cleanupFn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, particleCount, particleBaseSize, sizeRandomness, cameraDistance]);

  return <div ref={containerRef} className="logo-particles-container" />;
};

export default LogoParticles;

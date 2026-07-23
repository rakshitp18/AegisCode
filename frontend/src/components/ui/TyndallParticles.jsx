import { useEffect, useRef, useCallback } from "react";

/**
 * TyndallParticles
 * ─────────────────
 * Two-layer dark atmosphere:
 *  1. FOG BLOBS  — 6 large, slow-drifting radial glows (visible misty patches)
 *  2. PARTICLES  — fine falling dust with sinusoidal sway (snowfall feel)
 *
 * The upper-right Tyndall light source illuminates both layers.
 */

const FOG_COUNT = 6;
const PARTICLE_BASE = 280; // base particle count (scales with viewport)

function makeFogBlob(W, H) {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    // Fog patches are large — 25-55% of the smaller viewport dimension
    radius: (0.25 + Math.random() * 0.30) * Math.min(W, H),
    // Drift velocity — imperceptibly slow
    vx: (Math.random() - 0.5) * 0.06,
    vy: (Math.random() - 0.5) * 0.04,
    // Opacity: visible but not blinding  (0.04 – 0.11)
    alpha: 0.04 + Math.random() * 0.07,
    // Each blob has a slightly different color temperature
    r: 175 + Math.floor(Math.random() * 40),
    g: 180 + Math.floor(Math.random() * 35),
    b: 195 + Math.floor(Math.random() * 30),
  };
}

function makeParticle(W, H, randomY = true) {
  return {
    x: Math.random() * W,
    y: randomY ? Math.random() * H : -Math.random() * 40,
    radius: Math.random() < 0.72 ? 0.35 + Math.random() * 0.85 : 1.1 + Math.random() * 0.9,
    vy: 0.15 + Math.random() * 0.42,
    swayAmp: 0.25 + Math.random() * 0.55,
    swayFreq: 0.00028 + Math.random() * 0.00044,
    swayOff: Math.random() * Math.PI * 2,
    baseAlpha: 0.08 + Math.random() * 0.62,
    twinklePeriod: 2500 + Math.random() * 5500,
    twinkleOff: Math.random() * Math.PI * 2,
    warm: Math.random() < 0.28,
  };
}

function TyndallParticles({ className = "" }) {
  const canvasRef = useRef(null);
  const fogRef    = useRef([]);
  const ptRef     = useRef([]);
  const rafRef    = useRef(null);

  const init = useCallback((W, H) => {
    fogRef.current = Array.from({ length: FOG_COUNT }, () => makeFogBlob(W, H));
    const COUNT = PARTICLE_BASE + Math.floor((W * H) / 4500);
    ptRef.current = Array.from({ length: COUNT }, () => makeParticle(W, H, true));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      init(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (ts) => {
      const W = canvas.width;
      const H = canvas.height;

      // ── 1. Background ──────────────────────────────────────────────────
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, W, H);

      // ── 2. Tyndall light bloom (upper-right) ───────────────────────────
      const bloom = ctx.createRadialGradient(
        W * 0.76, H * 0.10, 0,
        W * 0.76, H * 0.10, W * 0.58
      );
      bloom.addColorStop(0,   "rgba(210,215,225,0.09)");
      bloom.addColorStop(0.35,"rgba(160,165,178,0.045)");
      bloom.addColorStop(0.7, "rgba(80,85,100,0.015)");
      bloom.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, W, H);

      // ── 3. Animated fog blobs ──────────────────────────────────────────
      const fog = fogRef.current;
      for (let i = 0; i < fog.length; i++) {
        const f = fog[i];

        // Drift
        f.x += f.vx;
        f.y += f.vy;

        // Soft bounce off edges so fog never leaves the viewport entirely
        if (f.x < -f.radius * 0.5) f.vx =  Math.abs(f.vx);
        if (f.x >  W + f.radius * 0.5) f.vx = -Math.abs(f.vx);
        if (f.y < -f.radius * 0.5) f.vy =  Math.abs(f.vy);
        if (f.y >  H + f.radius * 0.5) f.vy = -Math.abs(f.vy);

        // Very slow alpha breathing
        const breathe = 0.75 + 0.25 * Math.sin(ts * 0.00018 + i * 1.3);
        const a = f.alpha * breathe;

        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
        g.addColorStop(0,   `rgba(${f.r},${f.g},${f.b},${a})`);
        g.addColorStop(0.45,`rgba(${f.r},${f.g},${f.b},${(a * 0.45).toFixed(3)})`);
        g.addColorStop(1,   "rgba(0,0,0,0)");

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── 4. Falling dust particles ──────────────────────────────────────
      const pt = ptRef.current;
      for (let i = 0; i < pt.length; i++) {
        const p = pt[i];

        p.y += p.vy;
        p.x += Math.sin(ts * p.swayFreq + p.swayOff) * p.swayAmp * 0.22;

        if (p.y > H + 8) {
          Object.assign(p, makeParticle(W, H, false));
          continue;
        }
        if (p.x < -4) p.x = W + 4;
        if (p.x > W + 4) p.x = -4;

        const twinkle = 0.5 + 0.5 * Math.sin(ts / p.twinklePeriod * Math.PI * 2 + p.twinkleOff);
        const alpha = p.baseAlpha * (0.48 + twinkle * 0.52);
        const glowR = p.radius * 3.0;

        const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        if (p.warm) {
          pg.addColorStop(0,    `rgba(248,243,238,${alpha})`);
          pg.addColorStop(0.42, `rgba(215,210,205,${(alpha * 0.32).toFixed(3)})`);
        } else {
          pg.addColorStop(0,    `rgba(255,255,255,${alpha})`);
          pg.addColorStop(0.42, `rgba(200,210,225,${(alpha * 0.32).toFixed(3)})`);
        }
        pg.addColorStop(1, "rgba(0,0,0,0)");

        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = pg;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ display: "block" }}
    />
  );
}

export default TyndallParticles;

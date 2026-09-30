import React, { useEffect, useRef } from 'react';

/**
 * AnimatedHero — pure canvas 2D animation.
 * Floating geometric nodes connected by faint lines,
 * pulsing rings, and drifting particles in deep-blue palette.
 * No Three.js, no WebGL. Falls back to static gradient if canvas unavailable.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  pulse: number;
  pulseSpeed: number;
  type: 'node' | 'particle';
}

const BLUE_PALETTE = [
  'rgba(96, 165, 250,',   // blue-400
  'rgba(147, 197, 253,',  // blue-300
  'rgba(59,  130, 246,',  // blue-500
  'rgba(255, 255, 255,',  // white
  'rgba(186, 230, 253,',  // sky-200
];

function createNodes(w: number, h: number): Node[] {
  const nodes: Node[] = [];
  const count = Math.min(60, Math.floor((w * h) / 18000));

  for (let i = 0; i < count; i++) {
    const isParticle = i > count * 0.65;
    nodes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: isParticle ? Math.random() * 1.5 + 0.5 : Math.random() * 3 + 1.5,
      alpha: Math.random() * 0.5 + 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.008,
      type: isParticle ? 'particle' : 'node',
    });
  }
  return nodes;
}

export const AnimatedHero: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.scale(dpr, dpr);
      sizeRef.current = { w, h };
      nodesRef.current = createNodes(w, h);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (prefersReduced) {
      // Static fallback — draw once
      drawFrame(ctx, nodesRef.current, sizeRef.current.w, sizeRef.current.h, 0);
      return () => ro.disconnect();
    }

    let t = 0;
    function loop() {
      t += 1;
      const { w, h } = sizeRef.current;
      const nodes = nodesRef.current;

      // Move nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.pulseSpeed;
        // Wrap around edges
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }

      drawFrame(ctx!, nodes, w, h, t);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
};

function drawFrame(
  ctx: CanvasRenderingContext2D,
  nodes: Node[],
  w: number,
  h: number,
  t: number,
) {
  ctx.clearRect(0, 0, w, h);

  const MAX_DIST = 160;

  // Draw connecting lines between nearby nodes
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    if (a.type === 'particle') continue;
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      if (b.type === 'particle') continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > MAX_DIST) continue;

      const opacity = (1 - dist / MAX_DIST) * 0.18;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(147, 197, 253, ${opacity})`;
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }
  }

  // Draw pulsing rings on larger nodes
  for (const n of nodes) {
    if (n.type === 'particle') continue;
    if (n.r < 3) continue;

    const pulseR = n.r + Math.sin(n.pulse) * 6 + 6;
    const pulseAlpha = (Math.sin(n.pulse) * 0.5 + 0.5) * 0.12;

    const grad = ctx.createRadialGradient(n.x, n.y, n.r, n.x, n.y, pulseR);
    grad.addColorStop(0, `rgba(96, 165, 250, ${pulseAlpha})`);
    grad.addColorStop(1, 'rgba(96, 165, 250, 0)');
    ctx.beginPath();
    ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Draw nodes
  for (const n of nodes) {
    const liveAlpha = n.alpha * (0.7 + Math.sin(n.pulse) * 0.3);
    const colorBase = BLUE_PALETTE[Math.floor(n.r * 1.5) % BLUE_PALETTE.length];

    if (n.type === 'node') {
      // Outer glow
      const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
      glow.addColorStop(0, `${colorBase}${liveAlpha * 0.4})`);
      glow.addColorStop(1, `${colorBase}0)`);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `${colorBase}${liveAlpha})`;
      ctx.fill();
    } else {
      // Tiny particle
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${liveAlpha * 0.5})`;
      ctx.fill();
    }
  }

  // Subtle rotating hex grid accent top-right
  const cx = w * 0.82;
  const cy = h * 0.28;
  const hexR = 90;
  const angle = t * 0.003;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  for (let ring = 1; ring <= 3; ring++) {
    ctx.beginPath();
    for (let side = 0; side < 6; side++) {
      const a = (side / 6) * Math.PI * 2 - Math.PI / 6;
      const hx = Math.cos(a) * hexR * ring * 0.35;
      const hy = Math.sin(a) * hexR * ring * 0.35;
      side === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(96, 165, 250, ${0.12 / ring})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();

  // Second rotating hex — bottom left
  const cx2 = w * 0.12;
  const cy2 = h * 0.72;
  ctx.save();
  ctx.translate(cx2, cy2);
  ctx.rotate(-angle * 0.7);
  for (let ring = 1; ring <= 2; ring++) {
    ctx.beginPath();
    for (let side = 0; side < 6; side++) {
      const a = (side / 6) * Math.PI * 2 - Math.PI / 6;
      const hx = Math.cos(a) * 65 * ring * 0.4;
      const hy = Math.sin(a) * 65 * ring * 0.4;
      side === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(147, 197, 253, ${0.1 / ring})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.restore();
}

export default AnimatedHero;

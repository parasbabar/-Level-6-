import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Coin Geometry ────────────────────────────────────────────────────────────

function CoinMesh({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgeRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();

  // PBR Metallic gold material
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#C8A44A'),
    metalness: 0.92,
    roughness: 0.14,
    envMapIntensity: 1.4,
  }), []);

  const edgeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#B8923A'),
    metalness: 0.95,
    roughness: 0.18,
    envMapIntensity: 1.2,
  }), []);

  // Dollar sign geometry via canvas texture
  const dollarTexture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base gold gradient
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, '#E8C870');
    grad.addColorStop(0.5, '#C8A44A');
    grad.addColorStop(1, '#A87830');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Outer ring
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#8A6020';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 28, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 220, 120, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Reeded edge dots
    for (let i = 0; i < 80; i++) {
      const angle = (i / 80) * Math.PI * 2;
      const r = size / 2 - 16;
      const x = size / 2 + Math.cos(angle) * r;
      const y = size / 2 + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 70, 10, 0.5)';
      ctx.fill();
    }

    // Dollar sign
    ctx.font = 'bold 240px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(80, 50, 5, 0.75)';
    ctx.shadowColor = 'rgba(255, 200, 80, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText('$', size / 2, size / 2 + 8);

    // Highlight arc
    ctx.beginPath();
    ctx.arc(size / 2 - 40, size / 2 - 50, 140, 0.8, 2.4);
    ctx.strokeStyle = 'rgba(255, 245, 180, 0.35)';
    ctx.lineWidth = 30;
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  // Face material with dollar texture
  const faceMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: dollarTexture,
    metalness: 0.88,
    roughness: 0.12,
    envMapIntensity: 1.5,
  }), [dollarTexture]);

  // Ridged edge geometry
  const ridgedEdgeGeometry = useMemo(() => {
    const segments = 120;
    const radius = 1.0;
    const thickness = 0.12;
    const geo = new THREE.TorusGeometry(radius, thickness, 8, segments);
    return geo;
  }, []);

  // Coin disc geometry
  const coinGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(1.0, 1.0, 0.09, 120, 1, false);
  }, []);

  // Set up environment map for reflections
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    // Create a simple white environment
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0xffffff);
    const envMap = pmrem.fromScene(envScene as THREE.Scene).texture;
    goldMaterial.envMap = envMap;
    edgeMaterial.envMap = envMap;
    faceMaterial.envMap = envMap;
    pmrem.dispose();
    return () => {
      envMap.dispose();
    };
  }, [gl, goldMaterial, edgeMaterial, faceMaterial]);

  // Scroll-driven animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Idle float
    const idleFloat = Math.sin(t * 0.8) * 0.06;
    const idleTilt = Math.sin(t * 0.5) * 0.04;

    // Scroll-driven movement
    const s = scrollProgress;

    // Position: coin travels along a path as user scrolls
    const px = THREE.MathUtils.lerp(-0.3, 1.2, s * 1.2);
    const py = THREE.MathUtils.lerp(0, -1.0, s) + idleFloat;
    const scale = THREE.MathUtils.lerp(1.0, 0.45, Math.min(s * 1.4, 1.0));
    const rotY = t * 0.6 + s * Math.PI * 3;
    const rotX = idleTilt + s * 0.3;

    groupRef.current.position.set(px, py, 0);
    groupRef.current.rotation.set(rotX, rotY, 0.05);
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      {/* Main coin disc */}
      <mesh ref={meshRef} geometry={coinGeometry}>
        <meshStandardMaterial
          map={dollarTexture}
          metalness={0.88}
          roughness={0.12}
        />
      </mesh>

      {/* Gold rim */}
      <mesh geometry={coinGeometry}>
        <meshStandardMaterial
          color="#B8923A"
          metalness={0.95}
          roughness={0.18}
        />
      </mesh>

      {/* Ridged edge torus */}
      <mesh
        ref={edgeRef}
        geometry={ridgedEdgeGeometry}
        rotation={[Math.PI / 2, 0, 0]}
        material={edgeMaterial}
      />

      {/* Highlight shimmer disk on top face */}
      <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 64]} />
        <meshStandardMaterial
          map={dollarTexture}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={1}
        />
      </mesh>

      {/* Back face */}
      <mesh position={[0, -0.046, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 64]} />
        <meshStandardMaterial
          color="#C09030"
          metalness={0.92}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
}

// ─── Lights ───────────────────────────────────────────────────────────────────

function CoinLights({ isDark }: { isDark: boolean }) {
  return (
    <>
      {/* Key light - top right warm */}
      <directionalLight
        position={[4, 6, 3]}
        intensity={isDark ? 2.5 : 2.0}
        color="#FFF8E8"
      />
      {/* Fill light - left cool */}
      <directionalLight
        position={[-3, 2, 2]}
        intensity={isDark ? 0.8 : 0.6}
        color="#E8F0FF"
      />
      {/* Rim light - bottom back */}
      <directionalLight
        position={[1, -4, -2]}
        intensity={isDark ? 1.2 : 0.9}
        color="#FFD060"
      />
      {/* Ambient */}
      <ambientLight intensity={isDark ? 0.3 : 0.5} color="#FFF5E0" />
      {/* Point accent */}
      <pointLight position={[0, 3, 2]} intensity={isDark ? 1.5 : 1.0} color="#D6B36A" distance={8} />
    </>
  );
}

// ─── Fallback for no-WebGL ────────────────────────────────────────────────────

function CoinFallback() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #E8D48A 0%, #C8A44A 40%, #8A6020 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 48px rgba(214,179,106,0.4), inset 0 -4px 16px rgba(0,0,0,0.3)',
          border: '4px solid #B8923A',
        }}
      >
        <span
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: 'rgba(80,50,5,0.7)',
            fontFamily: 'serif',
            lineHeight: 1,
            textShadow: '0 2px 8px rgba(255,200,80,0.5)',
          }}
        >
          $
        </span>
      </div>
    </div>
  );
}

// ─── Public Component ─────────────────────────────────────────────────────────

interface DollarCoinProps {
  scrollProgress?: number;
  isDark?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

let webglSupported: boolean | null = null;
function checkWebGL(): boolean {
  if (webglSupported !== null) return webglSupported;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    webglSupported = !!ctx;
  } catch {
    webglSupported = false;
  }
  return webglSupported;
}

export const DollarCoin: React.FC<DollarCoinProps> = ({
  scrollProgress = 0,
  isDark = true,
  className = '',
  style,
}) => {
  if (!checkWebGL()) {
    return (
      <div className={className} style={style}>
        <CoinFallback />
      </div>
    );
  }

  return (
    <div className={className} style={style} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <CoinLights isDark={isDark} />
        <CoinMesh scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
};

export default DollarCoin;

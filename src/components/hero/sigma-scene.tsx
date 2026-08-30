"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Outlines, RoundedBox } from "@react-three/drei";

/**
 * Procedural geometry only — no imported 3D assets. The object is built
 * from beveled bars assembled into the same sigma+ silhouette as the 2D
 * wordmark (top bar, two diagonals meeting at a vertex, bottom bar, plus
 * a "+" sitting in the open right-hand pocket) so the brand reads as one
 * consistent geometric idea in 2D and 3D.
 */
const DEPTH = 0.55;
const THICK = 0.42;

function Bar({
  length,
  position,
  rotationZ = 0,
  color,
}: {
  length: number;
  position: [number, number, number];
  rotationZ?: number;
  color: string;
}) {
  return (
    <RoundedBox
      args={[length, THICK, DEPTH]}
      radius={0.08}
      smoothness={2}
      position={position}
      rotation={[0, 0, rotationZ]}
    >
      <meshStandardMaterial color="#151b28" metalness={0.85} roughness={0.28} />
      <Outlines thickness={1.6} color={color} transparent opacity={0.9} />
    </RoundedBox>
  );
}

function SigmaObject({ quality }: { quality: "full" | "reduced" }) {
  const tiltGroup = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const lerpFactor = 1 - Math.pow(0.001, delta);
    pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, state.pointer.x, lerpFactor);
    pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, state.pointer.y, lerpFactor);
    if (tiltGroup.current) {
      tiltGroup.current.rotation.y = pointer.current.x * 0.35;
      tiltGroup.current.rotation.x = -pointer.current.y * 0.25;
    }
  });

  // Sigma geometry: top bar, bottom bar, two diagonals meeting at a vertex.
  const barLen = 3.1;
  const topY = 1.55;
  const leftX = -1.85;
  const vertexX = 0.35;
  const diagLen = Math.hypot(vertexX - leftX, topY);
  const diagAngle = Math.atan2(topY, vertexX - leftX);

  return (
    <group ref={tiltGroup}>
      <Float speed={1.4} floatIntensity={0.6} rotationIntensity={quality === "full" ? 0.5 : 0.2}>
        <group rotation={[0.12, -0.45, 0]}>
          <Bar length={barLen} position={[leftX + barLen / 2, topY, 0]} color="#5B8CFF" />
          <Bar length={barLen} position={[leftX + barLen / 2, -topY, 0]} color="#5B8CFF" />
          <Bar
            length={diagLen}
            position={[(leftX + vertexX) / 2, topY / 2, 0]}
            rotationZ={-diagAngle}
            color="#5B8CFF"
          />
          <Bar
            length={diagLen}
            position={[(leftX + vertexX) / 2, -topY / 2, 0]}
            rotationZ={diagAngle}
            color="#5B8CFF"
          />

          {/* plus, in the open right-hand pocket */}
          <Bar length={1.9} position={[1.75, 0, 0]} color="#22C7D9" />
          <Bar length={1.9} position={[1.75, 0, 0]} rotationZ={Math.PI / 2} color="#22C7D9" />
        </group>
      </Float>
      {quality === "full" && (
        <Sparkles count={60} scale={4.2} size={2} speed={0.25} color="#5B8CFF" opacity={0.6} />
      )}
    </group>
  );
}

export function SigmaScene({ quality }: { quality: "full" | "reduced" }) {
  return (
    <Canvas
      dpr={quality === "full" ? [1, 1.75] : [1, 1]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 7], fov: 32 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 5]} intensity={40} color="#5B8CFF" />
      <pointLight position={[-4, -3, 3]} intensity={18} color="#22C7D9" />
      <directionalLight position={[0, 5, 2]} intensity={0.6} color="#F4F6FB" />
      <SigmaObject quality={quality} />
    </Canvas>
  );
}

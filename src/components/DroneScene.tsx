import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationState } from '@/types/simulation';

interface DroneSceneProps {
  state: SimulationState;
}

// Drone mesh component
function Drone({ position, rotation, fovRange, fovAngle }: {
  position: [number, number, number];
  rotation: number;
  fovRange: number;
  fovAngle: number;
}) {
  const droneRef = useRef<THREE.Group>(null);
  const fovRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (droneRef.current) {
      // Subtle hovering animation
      droneRef.current.position.y = position[1] + Math.sin(Date.now() * 0.003) * 0.1;
    }
    if (fovRef.current) {
      fovRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={droneRef} position={position}>
      {/* Drone body */}
      <mesh rotation={[0, rotation, 0]}>
        {/* Main body */}
        <group>
          {/* Central body */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.6, 0.15, 0.6]} />
            <meshStandardMaterial color="#1a2b3c" metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Top dome */}
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.1} emissive="#0ea5e9" emissiveIntensity={0.3} />
          </mesh>
          
          {/* Arms */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * Math.PI) / 2 + Math.PI / 4;
            const x = Math.cos(angle) * 0.4;
            const z = Math.sin(angle) * 0.4;
            return (
              <group key={i}>
                {/* Arm */}
                <mesh position={[x * 0.5, 0, z * 0.5]} rotation={[0, angle, 0]}>
                  <boxGeometry args={[0.5, 0.08, 0.08]} />
                  <meshStandardMaterial color="#2d3a4a" metalness={0.6} roughness={0.3} />
                </mesh>
                {/* Rotor */}
                <mesh position={[x, 0.05, z]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.03, 16]} />
                  <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.1} transparent opacity={0.8} />
                </mesh>
                {/* Rotor glow */}
                <pointLight position={[x, 0.1, z]} color="#0ea5e9" intensity={0.3} distance={1} />
              </group>
            );
          })}
          
          {/* Front indicator */}
          <mesh position={[0.35, 0, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1} />
          </mesh>
        </group>
      </mesh>

      {/* FOV Cone */}
      <mesh ref={fovRef} position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[fovRange * 0.8, fovRange, 32, 1, true]} />
        <meshBasicMaterial 
          color="#0ea5e9" 
          transparent 
          opacity={0.1} 
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* FOV ring on ground */}
      <mesh position={[0, -position[1] + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[fovRange * 0.7, fovRange * 0.8, 64]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Drone light */}
      <pointLight position={[0, -0.5, 0]} color="#0ea5e9" intensity={2} distance={fovRange * 2} />
    </group>
  );
}

// Obstacle component
function Obstacle({ position, size, visible }: {
  position: [number, number, number];
  size: { width: number; height: number; depth: number };
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <mesh position={[position[0], size.height / 2, position[2]]}>
      <boxGeometry args={[size.width, size.height, size.depth]} />
      <meshStandardMaterial 
        color="#ffffff" 
        metalness={0.3} 
        roughness={0.7}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// Intruder component
function Intruder({ position, detected, threatLevel }: {
  position: [number, number, number];
  detected: boolean;
  threatLevel: 'low' | 'medium' | 'high';
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const color = useMemo(() => {
    switch (threatLevel) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#eab308';
    }
  }, [threatLevel]);

  useFrame((_, delta) => {
    if (meshRef.current && detected) {
      meshRef.current.rotation.y += delta * 2;
    }
  });

  if (!detected) return null;

  return (
    <group position={[position[0], 0.3, position[2]]}>
      {/* Intruder marker */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.8}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      
      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
        <ringGeometry args={[0.3, 0.5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Light */}
      <pointLight color={color} intensity={2} distance={3} />
    </group>
  );
}

// Heatmap overlay
function HeatmapOverlay({ grid, heatmapType }: {
  grid: SimulationState['grid'];
  heatmapType: SimulationState['activeHeatmap'];
}) {
  if (heatmapType === 'none') return null;

  return (
    <group position={[0, 0.02, 0]}>
      {grid.map((row, x) =>
        row.map((cell, y) => {
          let value = 0;
          let color = '#10b981';
          
          switch (heatmapType) {
            case 'coverage':
              value = cell.coverageValue;
              color = value > 0.7 ? '#10b981' : value > 0.3 ? '#f59e0b' : '#ef4444';
              break;
            case 'threat':
              value = cell.threatValue;
              color = value > 0.7 ? '#ef4444' : value > 0.3 ? '#f59e0b' : '#10b981';
              break;
            case 'uncertainty':
              value = cell.uncertaintyValue;
              color = value > 0.7 ? '#6366f1' : value > 0.3 ? '#8b5cf6' : '#a855f7';
              break;
          }

          if (value < 0.1) return null;

          return (
            <mesh
              key={`${x}-${y}`}
              position={[x - 10 + 0.5, 0, y - 10 + 0.5]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.9, 0.9]} />
              <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={value * 0.4}
                depthWrite={false}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

// Main scene content
function SceneContent({ state }: DroneSceneProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={50} />
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={40}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
      />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />

      {/* Ground grid */}
      <Grid
        args={[20, 20]}
        position={[0, 0, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#2d3a4a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3d4a5c"
        fadeDistance={50}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0f1419" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Boundary markers */}
      {[-10, 10].map((x) =>
        [-10, 10].map((z) => (
          <mesh key={`corner-${x}-${z}`} position={[x, 0.1, z]}>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
          </mesh>
        ))
      )}

      {/* Heatmap */}
      <HeatmapOverlay grid={state.grid} heatmapType={state.activeHeatmap} />

      {/* Obstacles */}
      {state.obstacles.map((obstacle) => (
        <Obstacle
          key={obstacle.id}
          position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}
          size={obstacle.size}
          visible={obstacle.visible}
        />
      ))}

      {/* Intruders */}
      {state.intruders.map((intruder) => (
        <Intruder
          key={intruder.id}
          position={[intruder.position.x, intruder.position.y, intruder.position.z]}
          detected={intruder.detected}
          threatLevel={intruder.threatLevel}
        />
      ))}

      {/* Drone */}
      <Drone
        position={[state.drone.position.x, state.drone.position.y, state.drone.position.z]}
        rotation={state.drone.rotation}
        fovRange={state.drone.fovRange}
        fovAngle={state.drone.fovAngle}
      />
    </>
  );
}

export function DroneScene({ state }: DroneSceneProps) {
  return (
    <div className="w-full h-full bg-background">
      <Canvas shadows gl={{ preserveDrawingBuffer: true }} id="drone-canvas">
        <SceneContent state={state} />
      </Canvas>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  SimulationState,
  Algorithm,
  Environment,
  HeatmapType,
  DroneState,
  Obstacle,
  Intruder,
  GridCell,
  Metrics,
  DecisionReason,
  TimelineEvent,
  Position,
} from '@/types/simulation';

const GRID_SIZE = 20;

// Generate initial grid
const createGrid = (fogOfWar: boolean = false): GridCell[][] => {
  const grid: GridCell[][] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    grid[x] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      grid[x][y] = {
        x,
        y,
        visited: false,
        lastVisited: 0,
        coverageValue: 0,
        threatValue: Math.random() * 0.3,
        uncertaintyValue: fogOfWar ? 1 : Math.random() * 0.5,
        isVisible: !fogOfWar,
      };
    }
  }
  return grid;
};

// Generate obstacles based on environment
const generateObstacles = (env: Environment): Obstacle[] => {
  const obstacles: Obstacle[] = [];

  switch (env) {
    case 'open-grid':
      return [];

    case 'urban-dense':
      for (let i = 0; i < 15; i++) {
        obstacles.push({
          id: `obs-${i}`,
          position: {
            x: Math.random() * 16 - 8,
            y: 0,
            z: Math.random() * 16 - 8,
          },
          size: {
            width: 0.8 + Math.random() * 1.2,
            height: 1 + Math.random() * 2,
            depth: 0.8 + Math.random() * 1.2,
          },
          type: 'static',
          visible: true,
        });
      }
      break;

    case 'maze-facility': {
      // Create maze-like walls
      const wallPositions = [
        { x: -6, z: 0, w: 0.3, d: 8 },
        { x: -3, z: -4, w: 0.3, d: 8 },
        { x: 0, z: 2, w: 0.3, d: 8 },
        { x: 3, z: -2, w: 0.3, d: 8 },
        { x: 6, z: 0, w: 0.3, d: 8 },
        { x: -4, z: -6, w: 8, d: 0.3 },
        { x: 2, z: -3, w: 6, d: 0.3 },
        { x: -2, z: 3, w: 8, d: 0.3 },
        { x: 4, z: 6, w: 6, d: 0.3 },
      ];
      wallPositions.forEach((wall, i) => {
        obstacles.push({
          id: `wall-${i}`,
          position: { x: wall.x, y: 0, z: wall.z },
          size: { width: wall.w, height: 1.5, depth: wall.d },
          type: 'static',
          visible: true,
        });
      });
      break;
    }

    case 'dynamic-risk':
      for (let i = 0; i < 6; i++) {
        obstacles.push({
          id: `obs-${i}`,
          position: {
            x: Math.random() * 14 - 7,
            y: 0,
            z: Math.random() * 14 - 7,
          },
          size: { width: 1, height: 1, depth: 1 },
          type: 'static',
          visible: true,
        });
      }
      break;

    case 'changing-env':
      for (let i = 0; i < 10; i++) {
        obstacles.push({
          id: `obs-${i}`,
          position: {
            x: Math.random() * 16 - 8,
            y: 0,
            z: Math.random() * 16 - 8,
          },
          size: { width: 1, height: 1.5, depth: 1 },
          type: 'dynamic',
          visible: Math.random() > 0.3,
        });
      }
      break;

    case 'fog-of-war':
      for (let i = 0; i < 8; i++) {
        obstacles.push({
          id: `obs-${i}`,
          position: {
            x: Math.random() * 14 - 7,
            y: 0,
            z: Math.random() * 14 - 7,
          },
          size: { width: 1, height: 1, depth: 1 },
          type: 'static',
          visible: true,
        });
      }
      break;
  }

  return obstacles;
};

// Generate intruders based on environment
const generateIntruders = (env: Environment): Intruder[] => {
  const intruders: Intruder[] = [];
  const count = env === 'dynamic-risk' ? 8 : 4;

  for (let i = 0; i < count; i++) {
    let x = Math.random() * 14 - 7;
    let z = Math.random() * 14 - 7;

    // Cluster intruders in dynamic-risk environment
    if (env === 'dynamic-risk' && i > 0) {
      const cluster = Math.floor(i / 2);
      const clusterCenters = [
        { x: -5, z: -5 },
        { x: 5, z: -5 },
        { x: -5, z: 5 },
        { x: 5, z: 5 },
      ];
      const center = clusterCenters[cluster % 4];
      x = center.x + (Math.random() - 0.5) * 3;
      z = center.z + (Math.random() - 0.5) * 3;
    }

    intruders.push({
      id: `intruder-${i}`,
      position: { x, y: 0, z },
      detected: false,
      threatLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
    });
  }

  return intruders;
};

const initialDroneState: DroneState = {
  position: { x: 0, y: 2, z: 0 },
  rotation: 0,
  fovAngle: 60,
  fovRange: 4,
  battery: 100,
  speed: 1,
  isMoving: false,
};

const initialMetrics: Metrics = {
  areaObserved: 0,
  blindSpots: 100,
  detectionLatency: 0,
  battery: 100,
  intrudersDetected: 0,
  totalIntruders: 0,
  patrolEfficiency: 0,
  avgResponseTime: 0,
};

export const useSimulation = () => {
  const [state, setState] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    speed: 1,
    currentAlgorithm: 'PDAP',
    currentEnvironment: 'open-grid',
    activeHeatmap: 'none',
    drone: initialDroneState,
    obstacles: [],
    intruders: generateIntruders('open-grid'),
    grid: createGrid(),
    metrics: { ...initialMetrics, totalIntruders: 4 },
    decisionReasons: [],
    timeline: [],
    elapsedTime: 0,
  });

  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const targetPositionRef = useRef<Position | null>(null);

  // Algorithm-specific movement logic
  const getNextPosition = useCallback((
    algorithm: Algorithm,
    drone: DroneState,
    grid: GridCell[][],
    intruders: Intruder[],
    obstacles: Obstacle[]
  ): { position: Position; reasons: DecisionReason[] } => {
    const reasons: DecisionReason[] = [];
    let nextPos: Position = { ...drone.position };

    const detectedIntruders = intruders.filter(i => i.detected);
    const unvisitedCells = grid.flat().filter(c => !c.visited);

    switch (algorithm) {
      case 'RPA': {
        // Random movement
        const angle = Math.random() * Math.PI * 2;
        const distance = 1 + Math.random() * 2;
        nextPos.x = Math.max(-9, Math.min(9, drone.position.x + Math.cos(angle) * distance));
        nextPos.z = Math.max(-9, Math.min(9, drone.position.z + Math.sin(angle) * distance));
        reasons.push({ id: 1, reason: 'Random direction selected', weight: 100, icon: 'Shuffle' });
        break;
      }

      case 'ZPA': {
        // Zigzag pattern
        const gridX = Math.floor((drone.position.x + 10) / 2);
        const direction = gridX % 2 === 0 ? 1 : -1;

        if (drone.position.z * direction >= 8) {
          nextPos.x = drone.position.x + 2;
          reasons.push({ id: 1, reason: 'Advancing to next row', weight: 80, icon: 'ArrowRight' });
        } else {
          nextPos.z = drone.position.z + direction * 2;
          reasons.push({ id: 1, reason: 'Continuing zigzag pattern', weight: 80, icon: 'TrendingUp' });
        }

        if (nextPos.x > 9) nextPos.x = -9;
        reasons.push({ id: 2, reason: 'Systematic coverage', weight: 60, icon: 'Grid3x3' });
        break;
      }

      case 'CPA': {
        // "Sector Sweep" - Systematic Coverage
        // 1. Identify Target Sector
        // Divide into 4 quadrants: NE (1), NW (2), SW (3), SE (4)
        const sectors = [
          { id: 1, x: 5, z: 5, score: 0 },   // NE
          { id: 2, x: -5, z: 5, score: 0 },  // NW
          { id: 3, x: -5, z: -5, score: 0 }, // SW
          { id: 4, x: 5, z: -5, score: 0 }   // SE
        ];

        // Score sectors by unvisited count
        sectors.forEach(s => {
          // Sample a few points in the sector to estimate coverage
          for (let dx = -2; dx <= 2; dx += 2) {
            for (let dz = -2; dz <= 2; dz += 2) {
              const gx = Math.floor(s.x + dx + 10);
              const gz = Math.floor(s.z + dz + 10);
              if (grid[gx]?.[gz] && !grid[gx][gz].visited) {
                s.score++;
              }
            }
          }
        });

        // Find best sector (highest unvisited score) that is closest
        sectors.sort((a, b) => b.score - a.score);
        const targetSector = sectors[0];

        if (targetSector.score > 0) {
          // 2. Intra-Sector Pathing
          // Move towards the center of the target sector if far away
          const distToSector = Math.hypot(targetSector.x - drone.position.x, targetSector.z - drone.position.z);

          if (distToSector > 5) {
            nextPos.x = targetSector.x;
            nextPos.z = targetSector.z;
            reasons.push({ id: 1, reason: `Transit to Sector ${targetSector.id}`, weight: 100, icon: 'ArrowRight' });
          } else {
            // We are in the sector, find immediate unvisited neighbor
            if (unvisitedCells.length > 0) {
              // Filter unvisited cells to only those in this sector approximately
              const localUnvisited = unvisitedCells.filter(c =>
                Math.abs((c.x - 10) - targetSector.x) < 8 &&
                Math.abs((c.y - 10) - targetSector.z) < 8
              );

              if (localUnvisited.length > 0) {
                // Find nearest
                const target = localUnvisited.reduce((best, cell) => {
                  const d = Math.hypot(cell.x - 10 - drone.position.x, cell.y - 10 - drone.position.z);
                  const bd = Math.hypot(best.x - 10 - drone.position.x, best.y - 10 - drone.position.z);
                  return d < bd ? cell : best;
                });
                nextPos.x = target.x - 10;
                nextPos.z = target.y - 10;
                reasons.push({ id: 1, reason: `Sweeping Sector ${targetSector.id}`, weight: 90, icon: 'Grid' });
              } else {
                // Fallback
                nextPos.x = targetSector.x;
                nextPos.z = targetSector.z;
                reasons.push({ id: 1, reason: 'Sector Finishing', weight: 60, icon: 'Check' });
              }
            }
          }
        } else {
          // All sectors covered? Go home.
          nextPos.x = 0;
          nextPos.z = 0;
          reasons.push({ id: 1, reason: 'Mission Complete - RTB', weight: 100, icon: 'Home' });
        }
        break;
      }

      case 'TFA': {
        // "Tactical Pursuit" - Advanced Threat Following
        if (detectedIntruders.length > 0) {
          try {
            // 1. Calculate Threat Centroid (Pack tracking)
            const centroid = detectedIntruders.reduce((acc, curr) => ({
              x: acc.x + (curr.position?.x || 0),
              z: acc.z + (curr.position?.z || 0)
            }), { x: 0, z: 0 });

            const count = Math.max(1, detectedIntruders.length);
            centroid.x /= count;
            centroid.z /= count;

            // 2. Calculate Standoff Vector
            const dx = centroid.x - drone.position.x;
            const dz = centroid.z - drone.position.z;
            const dist = Math.hypot(dx, dz);
            const angle = Math.atan2(dz, dx);

            // 3. Move Logic
            if (dist > 4) {
              // Far away: Fast intercept
              nextPos.x = drone.position.x + Math.cos(angle) * 3;
              nextPos.z = drone.position.z + Math.sin(angle) * 3;
              reasons.push({ id: 1, reason: `Intercepting target(s)`, weight: 100, icon: 'Crosshair' });
            } else if (dist < 2.5) {
              // Too close: Back off (Kiting)
              nextPos.x = drone.position.x - Math.cos(angle) * 2;
              nextPos.z = drone.position.z - Math.sin(angle) * 2;
              reasons.push({ id: 1, reason: 'Maintaing tactical standoff', weight: 90, icon: 'Shield' });
            } else {
              // Optimal range: Orbit/Hover
              nextPos.x = drone.position.x + Math.cos(angle + Math.PI / 2) * 1;
              nextPos.z = drone.position.z + Math.sin(angle + Math.PI / 2) * 1;
              reasons.push({ id: 1, reason: 'Tracking & Monitoring', weight: 85, icon: 'Eye' });
            }

            reasons.push({ id: 2, reason: `Threat Centroid: [${centroid.x.toFixed(1)}, ${centroid.z.toFixed(1)}]`, weight: 80, icon: 'MapPin' });
          } catch (e) {
            console.error("TFA Error:", e);
            // Fallback
            nextPos = { ...drone.position };
            reasons.push({ id: 1, reason: 'Navigation Error - Hovering', weight: 100, icon: 'AlertTriangle' });
          }

        } else {
          // No contacts: Spiral Search Pattern
          const t = Date.now() / 1000;
          const spiralRadius = 3 + Math.sin(t * 0.5) * 5;
          nextPos.x = Math.cos(t) * spiralRadius;
          nextPos.z = Math.sin(t) * spiralRadius;
          reasons.push({ id: 1, reason: 'Scanning for hostiles (Spiral)', weight: 50, icon: 'Search' });
          reasons.push({ id: 2, reason: 'Sector clear', weight: 30, icon: 'CheckCircle' });
        }
        break;
      }

      case 'PDAP': {
        try {
          // "Global Utility Hunter" - Global Optimization Algorithm
          const maxRange = (drone.battery || 0) > 50 ? 20 : 10;
          const moveCostWeight = (drone.battery || 0) > 30 ? 0.05 : 0.2;
          const uncertaintyWeight = 2.0;
          const coverageWeight = 1.0;

          let bestScore = -Infinity;
          let bestTarget: { x: number, z: number } | null = null;
          let primeReason = 'Patrolling';

          // Sample candidates
          const candidates: { x: number, z: number, type: string, val: number }[] = [];

          // 1. Add Intruder positions
          if (detectedIntruders.length > 0) {
            detectedIntruders.forEach(i => {
              if (i.position) {
                candidates.push({ x: i.position.x, z: i.position.z, type: 'threat', val: 10 });
              }
            });
            primeReason = 'Responding to threats';
          }

          // 2. Add clusters 
          for (let sx = -8; sx <= 8; sx += 4) {
            for (let sz = -8; sz <= 8; sz += 4) {
              candidates.push({ x: sx, z: sz, type: 'sector', val: 0 });
            }
          }

          candidates.forEach(cand => {
            const dist = Math.hypot(cand.x - drone.position.x, cand.z - drone.position.z);
            if (dist > maxRange) return;

            let score = (cand.val || 0);

            // Uncertainty Gain
            const gx = Math.floor(cand.x + 10);
            const gz = Math.floor(cand.z + 10);
            if (grid[gx] && grid[gx][gz]) {
              score += (grid[gx][gz].uncertaintyValue || 0) * uncertaintyWeight * 10;
              if (!grid[gx][gz].visited) score += coverageWeight * 5;
            }

            score -= dist * moveCostWeight;

            if (score > bestScore) {
              bestScore = score;
              bestTarget = { x: cand.x, z: cand.z };
              if (cand.type === 'threat') primeReason = 'Engaging identified threat';
              else if (cand.type === 'sector') primeReason = 'Exploring high-value sector';
            }
          });

          if (bestTarget) {
            nextPos.x = bestTarget.x;
            nextPos.z = bestTarget.z;
            reasons.push({ id: 1, reason: primeReason, weight: 95, icon: primeReason.includes('threat') ? 'AlertTriangle' : 'Compass' });
            reasons.push({ id: 2, reason: `Utility Score: ${bestScore.toFixed(1)}`, weight: 60, icon: 'Activity' });
          } else {
            // Fallback
            nextPos.x = 0;
            nextPos.z = 0;
            reasons.push({ id: 1, reason: 'Returning to base', weight: 50, icon: 'Home' });
          }
        } catch (e) {
          console.error("PDAP Error:", e);
          reasons.push({ id: 1, reason: 'Algorithm Error - Resetting', weight: 100, icon: 'RefreshCcw' });
        }
        break;
      }
    }

    // Clamp position
    nextPos.x = Math.max(-9, Math.min(9, nextPos.x));
    nextPos.z = Math.max(-9, Math.min(9, nextPos.z));

    return { position: nextPos, reasons: reasons.slice(0, 3) };
  }, []);

  // Update simulation
  const updateSimulation = useCallback((deltaTime: number) => {
    setState(prev => {
      if (!prev.isRunning || prev.isPaused) return prev;

      const dt = deltaTime * prev.speed;
      const newElapsed = prev.elapsedTime + dt;

      // Get target position if needed
      if (!targetPositionRef.current ||
        Math.hypot(
          prev.drone.position.x - targetPositionRef.current.x,
          prev.drone.position.z - targetPositionRef.current.z
        ) < 0.5) {
        const { position, reasons } = getNextPosition(
          prev.currentAlgorithm,
          prev.drone,
          prev.grid,
          prev.intruders,
          prev.obstacles
        );
        targetPositionRef.current = position;

        return {
          ...prev,
          decisionReasons: reasons,
        };
      }

      // Move drone towards target
      const target = targetPositionRef.current;
      const dx = target.x - prev.drone.position.x;
      const dz = target.z - prev.drone.position.z;
      const distance = Math.hypot(dx, dz);

      const moveSpeed = 2 * dt;
      const moveX = distance > 0.1 ? (dx / distance) * Math.min(moveSpeed, distance) : 0;
      const moveZ = distance > 0.1 ? (dz / distance) * Math.min(moveSpeed, distance) : 0;

      const newDrone: DroneState = {
        ...prev.drone,
        position: {
          x: prev.drone.position.x + moveX,
          y: prev.drone.position.y,
          z: prev.drone.position.z + moveZ,
        },
        rotation: Math.atan2(dz, dx),
        battery: Math.max(0, prev.drone.battery - 0.01 * dt),
        isMoving: distance > 0.1,
      };

      // Update grid coverage
      const newGrid = prev.grid.map(row => row.map(cell => ({ ...cell })));
      const droneGridX = Math.floor(newDrone.position.x + 10);
      const droneGridZ = Math.floor(newDrone.position.z + 10);

      // Mark cells in FOV as visited
      for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
          const gx = droneGridX + dx;
          const gz = droneGridZ + dz;
          if (gx >= 0 && gx < GRID_SIZE && gz >= 0 && gz < GRID_SIZE) {
            const dist = Math.hypot(dx, dz);
            if (dist <= newDrone.fovRange) {
              newGrid[gx][gz].visited = true;
              newGrid[gx][gz].lastVisited = newElapsed;
              newGrid[gx][gz].coverageValue = 1;
              newGrid[gx][gz].uncertaintyValue = Math.max(0, newGrid[gx][gz].uncertaintyValue - 0.1);
              newGrid[gx][gz].isVisible = true;
            }
          }
        }
      }

      // Check for intruder detection
      const newIntruders = prev.intruders.map(intruder => {
        const dist = Math.hypot(
          intruder.position.x - newDrone.position.x,
          intruder.position.z - newDrone.position.z
        );

        if (dist <= newDrone.fovRange && !intruder.detected) {
          return {
            ...intruder,
            detected: true,
            detectedAt: newElapsed,
          };
        }
        return intruder;
      });

      // Update timeline for new detections
      const newTimeline = [...prev.timeline];
      newIntruders.forEach((intruder, i) => {
        if (intruder.detected && !prev.intruders[i].detected) {
          newTimeline.unshift({
            id: `detection-${intruder.id}-${newElapsed}`,
            timestamp: newElapsed,
            type: 'detection',
            message: `Intruder detected at (${intruder.position.x.toFixed(1)}, ${intruder.position.z.toFixed(1)})`,
            severity: intruder.threatLevel === 'high' ? 'danger' : intruder.threatLevel === 'medium' ? 'warning' : 'info',
          });
        }
      });

      // Calculate metrics
      const visitedCount = newGrid.flat().filter(c => c.visited).length;
      const totalCells = GRID_SIZE * GRID_SIZE;
      const detectedCount = newIntruders.filter(i => i.detected).length;

      const newMetrics: Metrics = {
        areaObserved: (visitedCount / totalCells) * 100,
        blindSpots: ((totalCells - visitedCount) / totalCells) * 100,
        detectionLatency: detectedCount > 0
          ? newIntruders
            .filter(i => i.detected && i.detectedAt)
            .reduce((sum, i) => sum + (i.detectedAt || 0), 0) / detectedCount
          : 0,
        battery: newDrone.battery,
        intrudersDetected: detectedCount,
        totalIntruders: newIntruders.length,
        patrolEfficiency: (visitedCount / Math.max(1, newElapsed)) * 10,
        avgResponseTime: detectedCount > 0 ? prev.metrics.detectionLatency : 0,
      };

      return {
        ...prev,
        drone: newDrone,
        grid: newGrid,
        intruders: newIntruders,
        metrics: newMetrics,
        timeline: newTimeline.slice(0, 50),
        elapsedTime: newElapsed,
      };
    });
  }, [getNextPosition]);

  // Animation loop
  useEffect(() => {
    const animate = (time: number) => {
      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      updateSimulation(deltaTime);
      animationRef.current = requestAnimationFrame(animate);
    };

    if (state.isRunning && !state.isPaused) {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isRunning, state.isPaused, updateSimulation]);

  // Actions
  const startSimulation = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: true, isPaused: false }));
  }, []);

  const pauseSimulation = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeSimulation = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const stopSimulation = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false, isPaused: false }));
    targetPositionRef.current = null;
  }, []);

  const resetSimulation = useCallback(() => {
    targetPositionRef.current = null;
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      drone: initialDroneState,
      grid: createGrid(prev.currentEnvironment === 'fog-of-war'),
      intruders: generateIntruders(prev.currentEnvironment),
      obstacles: generateObstacles(prev.currentEnvironment),
      metrics: { ...initialMetrics, totalIntruders: generateIntruders(prev.currentEnvironment).length },
      decisionReasons: [],
      timeline: [],
      elapsedTime: 0,
    }));
  }, []);

  const setAlgorithm = useCallback((algorithm: Algorithm) => {
    setState(prev => ({ ...prev, currentAlgorithm: algorithm }));
    targetPositionRef.current = null;
  }, []);

  const setEnvironment = useCallback((environment: Environment) => {
    targetPositionRef.current = null;
    const newObstacles = generateObstacles(environment);
    const newIntruders = generateIntruders(environment);
    const isFogOfWar = environment === 'fog-of-war';

    setState(prev => ({
      ...prev,
      currentEnvironment: environment,
      obstacles: newObstacles,
      intruders: newIntruders,
      grid: createGrid(isFogOfWar),
      drone: initialDroneState,
      metrics: { ...initialMetrics, totalIntruders: newIntruders.length },
      timeline: [{
        id: `env-change-${Date.now()}`,
        timestamp: 0,
        type: 'environment',
        message: `Environment changed to ${environment}`,
        severity: 'info',
      }],
      elapsedTime: 0,
      isRunning: false,
      isPaused: false,
    }));
  }, []);

  const setHeatmap = useCallback((heatmap: HeatmapType) => {
    setState(prev => ({ ...prev, activeHeatmap: heatmap }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, speed }));
  }, []);

  const addTimelineEvent = useCallback((event: TimelineEvent) => {
    setState(prev => ({
      ...prev,
      timeline: [event, ...prev.timeline].slice(0, 50),
    }));
  }, []);

  return {
    state,
    actions: {
      startSimulation,
      pauseSimulation,
      resumeSimulation,
      stopSimulation,
      resetSimulation,
      setAlgorithm,
      setEnvironment,
      setHeatmap,
      setSpeed,
      addTimelineEvent,
    },
  };
};

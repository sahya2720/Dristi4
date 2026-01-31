// Simulation Types for Drone Dashboard

export type Algorithm = 'RPA' | 'ZPA' | 'CPA' | 'TFA' | 'PDAP';

export type Environment = 
  | 'open-grid'
  | 'urban-dense'
  | 'maze-facility'
  | 'dynamic-risk'
  | 'changing-env'
  | 'fog-of-war';

export type HeatmapType = 'coverage' | 'threat' | 'uncertainty' | 'none';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Obstacle {
  id: string;
  position: Position;
  size: { width: number; height: number; depth: number };
  type: 'static' | 'dynamic';
  visible: boolean;
}

export interface Intruder {
  id: string;
  position: Position;
  detected: boolean;
  threatLevel: 'low' | 'medium' | 'high';
  detectedAt?: number;
}

export interface DroneState {
  position: Position;
  rotation: number;
  fovAngle: number;
  fovRange: number;
  battery: number;
  speed: number;
  isMoving: boolean;
}

export interface GridCell {
  x: number;
  y: number;
  visited: boolean;
  lastVisited: number;
  coverageValue: number;
  threatValue: number;
  uncertaintyValue: number;
  isVisible: boolean; // For fog of war
}

export interface DecisionReason {
  id: number;
  reason: string;
  weight: number;
  icon: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'detection' | 'patrol' | 'alert' | 'decision' | 'environment';
  message: string;
  severity: 'info' | 'warning' | 'danger';
}

export interface Metrics {
  areaObserved: number;
  blindSpots: number;
  detectionLatency: number;
  battery: number;
  intrudersDetected: number;
  totalIntruders: number;
  patrolEfficiency: number;
  avgResponseTime: number;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  speed: number;
  currentAlgorithm: Algorithm;
  currentEnvironment: Environment;
  activeHeatmap: HeatmapType;
  drone: DroneState;
  obstacles: Obstacle[];
  intruders: Intruder[];
  grid: GridCell[][];
  metrics: Metrics;
  decisionReasons: DecisionReason[];
  timeline: TimelineEvent[];
  elapsedTime: number;
}

export interface AlgorithmInfo {
  id: Algorithm;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface EnvironmentInfo {
  id: Environment;
  name: string;
  description: string;
  icon: string;
}

export const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: 'RPA',
    name: 'Random Patrol',
    description: 'Randomly selects next patrol point',
    icon: 'Shuffle',
    color: 'hsl(var(--muted-foreground))',
  },
  {
    id: 'ZPA',
    name: 'Zigzag Patrol',
    description: 'Systematic zigzag coverage pattern',
    icon: 'TrendingUp',
    color: 'hsl(var(--info))',
  },
  {
    id: 'CPA',
    name: 'Coverage Priority',
    description: 'Prioritizes unvisited areas',
    icon: 'Grid3x3',
    color: 'hsl(var(--success))',
  },
  {
    id: 'TFA',
    name: 'Threat Following',
    description: 'Tracks and follows detected threats',
    icon: 'Target',
    color: 'hsl(var(--warning))',
  },
  {
    id: 'PDAP',
    name: 'Priority-Driven Adaptive',
    description: 'Dynamic priority balancing algorithm',
    icon: 'Brain',
    color: 'hsl(var(--primary))',
  },
];

export const ENVIRONMENTS: EnvironmentInfo[] = [
  {
    id: 'open-grid',
    name: 'Open Grid',
    description: 'Clear area with no obstacles',
    icon: 'LayoutGrid',
  },
  {
    id: 'urban-dense',
    name: 'Urban Dense',
    description: 'High-density obstacle layout',
    icon: 'Building2',
  },
  {
    id: 'maze-facility',
    name: 'Maze Facility',
    description: 'Complex maze-like structure',
    icon: 'Waypoints',
  },
  {
    id: 'dynamic-risk',
    name: 'Dynamic Risk Zones',
    description: 'Intruders appear in clusters',
    icon: 'AlertTriangle',
  },
  {
    id: 'changing-env',
    name: 'Changing Environment',
    description: 'Obstacles appear/disappear',
    icon: 'RefreshCw',
  },
  {
    id: 'fog-of-war',
    name: 'Fog of War',
    description: 'Limited visibility range',
    icon: 'Cloud',
  },
];

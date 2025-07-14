// Game Configuration
export const CONFIG = {
  // Movement and Speed
  CAMERA_SPEED: 0.12,
  MAGNETIC_POINT_MAX_SPEED: 0.18,
  ROAD_BOUNDS: 2.5,

  // Character Properties
  CUBE_SIZE: 0.4, // Smaller hitbox for stick people to reduce spreading
  CUBE_ROTATION_Y: 0.02,
  CUBE_ROTATION_X: 0.01,

  // Stick Person Properties
  STICK_PERSON_SCALE: 1.0,
  STICK_PERSON_ANIMATION_SPEED: 8,
  STICK_PERSON_LEG_SWING: 0.3,
  STICK_PERSON_ARM_SWING: 0.2,
  STICK_PERSON_BOB_HEIGHT: 0.05,

  // Physics
  ATTRACTION_STRENGTH: 0.08, // Extremely strong attraction
  ATTRACTION_MIN_DISTANCE: 0.05, // Almost no dead zone
  HARD_REPULSION_STRENGTH: 0.01, // Extremely weak hard repulsion
  HARD_REPULSION_MIN_DISTANCE: 0.1, // Extremely tiny hard repulsion zone
  SOFT_REPULSION_STRENGTH: 0.001, // Practically no soft repulsion
  SOFT_REPULSION_COMFORT_DISTANCE: 0.15, // Extremely tiny comfort distance
  VELOCITY_DAMPING: 0.85,
  MAX_VELOCITY: 0.1,
  COLLISION_MIN_SEPARATION: 0.05, // Practically overlapping

  // Gate System
  GATE_SPACING: 10,
  INITIAL_GATE_Z: -30,
  GATE_GENERATION_DISTANCE: 30,
  GATE_CLEANUP_DISTANCE: 20,
  GATE_POST_WIDTH: 0.3,
  GATE_POST_HEIGHT: 3,
  GATE_FORCE_FIELD_WIDTH: 3,
  GATE_FORCE_FIELD_HEIGHT: 3,
  GATE_FORCE_FIELD_OPACITY: 0.3,
  GATE_LEFT_INNER_POST_X: -0.2,
  GATE_LEFT_OUTER_POST_X: -3,
  GATE_RIGHT_INNER_POST_X: 0.2,
  GATE_RIGHT_OUTER_POST_X: 3,
  GATE_COLLISION_THRESHOLD: 1,

  // Gate Effects
  BLUE_GATE_DUPLICATION_CHANCE: 0.3,

  // Road Properties
  ROAD_WIDTH: 6,
  ROAD_LENGTH: 2000,
  ROAD_POSITION_Y: -2,
  ROAD_POSITION_Z: -500,
  ROAD_LINE_WIDTH: 0.2,
  ROAD_LINE_POSITIONS: {
    CENTER: 0,
    LEFT: -2.8,
    RIGHT: 2.8,
  },

  // Camera Properties
  CAMERA_FOV: 75,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  CAMERA_START_POSITION: { x: 0, y: 3, z: 8 },
  CAMERA_LOOK_AHEAD_DISTANCE: 18,
  CAMERA_INITIAL_LOOK_AT: { x: 0, y: 0, z: -10 },

  // Starfield
  STAR_COUNT: 1000,
  STAR_SIZE: 2,
  STAR_SPREAD: 2000,

  // Colors
  COLORS: {
    POSITIVE_GATE: 0x4444ff, // Blue
    NEGATIVE_GATE: 0xff4444, // Red
    CUBE: 0x00ff00, // Green
    CUBE_EDGES: 0x000000, // Black
    ROAD: 0x333333, // Dark gray
    ROAD_LINES: 0xffffff, // White
    STARS: 0xffffff, // White
    BACKGROUND: 0x000428, // Dark blue
  },

  // Mouse Controls
  MOUSE_SENSITIVITY: 0.01,

  // RNG Functions
  RNG: {
    // Gate positioning
    gatePositionX: () => (Math.random() - 0.5) * 3,

    // Gate type assignment
    isLeftGatePositive: () => Math.random() > 0.5,

    // Cube spawning
    cubeSpawnOffsetX: () => (Math.random() - 0.5) * 1.5,
    cubeSpawnOffsetZ: () => (Math.random() - 0.5) * 1.5,
    cubeInitialSpawnZ: () => Math.random() * 3,

    // Physics randomization
    cubeAttractorOffset: () => (Math.random() - 0.5) * 1.5,

    // Starfield
    starPosition: () => (Math.random() - 0.5) * 2000,

    // Blue gate duplication check
    shouldDuplicate: () => Math.random() < CONFIG.BLUE_GATE_DUPLICATION_CHANCE,
  },
};

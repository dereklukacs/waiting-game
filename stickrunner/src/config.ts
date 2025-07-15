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
  STICK_PERSON_GROUND_Y: -1.2, // Y position when walking on road
  STICK_PERSON_JUMP_HEIGHT: 0.8, // Maximum jump height
  STICK_PERSON_JUMP_DURATION: 45, // Frames for complete jump cycle
  STICK_PERSON_JUMP_RATE: 15, // Frames between jumps (manual jump cooldown)
  
  // Zombie Properties
  ZOMBIE_SPEED: 0.08, // Slightly slower than camera speed
  ZOMBIE_SPAWN_DISTANCE: -50, // How far ahead zombies spawn
  ZOMBIE_SPAWN_RATE: 0.02, // Probability per frame of spawning a zombie
  ZOMBIE_COLLISION_DISTANCE: 0.5, // How close zombies need to be to "catch" stick people
  ZOMBIE_CLEANUP_DISTANCE: 15, // Remove zombies this far behind camera

  // Bullet Properties
  BULLET_SPEED: 0.3, // Forward speed of bullets
  BULLET_SIZE: 0.08, // Size of bullet spheres (larger for better visibility)
  BULLET_RATE: 30, // Frames between shots (30 frames = ~0.5 seconds at 60fps)
  BULLET_RANGE: 50, // Maximum distance bullets travel
  BULLET_DAMAGE_DISTANCE: 0.5, // How close bullets need to be to hit zombies (increased)

  // Obstacle Properties
  OBSTACLE_WIDTH: 2.4, // Width of obstacles (80% of one lane width)
  OBSTACLE_HEIGHT: 0.3, // Height of obstacles (lower for easier jumping)
  OBSTACLE_DEPTH: 0.4, // Depth of obstacles
  OBSTACLE_SPAWN_RATE: 0.002, // Very low spawn rate (0.2% per frame)
  OBSTACLE_SPAWN_DISTANCE: -50, // How far ahead obstacles spawn
  OBSTACLE_CLEANUP_DISTANCE: 20, // Remove obstacles this far behind camera
  OBSTACLE_COLLISION_HEIGHT: 0.4, // Maximum height where collision occurs
  OBSTACLE_MIN_SPACING: 15, // Large minimum distance between obstacles

  // Physics
  ATTRACTION_STRENGTH: 0.022, // Slightly reduced attraction
  ATTRACTION_MIN_DISTANCE: 0.3, // Slightly larger dead zone
  HARD_REPULSION_STRENGTH: 0.07, // Slightly stronger repulsion for breathing room
  HARD_REPULSION_MIN_DISTANCE: 0.5, // Slightly larger hard repulsion zone
  SOFT_REPULSION_STRENGTH: 0.018, // Slightly stronger soft repulsion
  SOFT_REPULSION_COMFORT_DISTANCE: 0.8, // Slightly larger comfort distance
  VELOCITY_DAMPING: 0.85,
  MAX_VELOCITY: 0.1,
  COLLISION_MIN_SEPARATION: 0.25, // Slightly more personal space

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
  ROAD_BOUNDARY_LEFT: -3.2,  // Left edge of road for boundary checking
  ROAD_BOUNDARY_RIGHT: 3.2,  // Right edge of road for boundary checking
  FALL_CLEANUP_Y: -10,       // Y position at which to remove fallen figures

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

  // Colors - Updated for better vibrancy
  COLORS: {
    POSITIVE_GATE: 0x5555ff, // Brighter blue
    NEGATIVE_GATE: 0xff5555, // Brighter red
    CUBE: 0x00ff00, // Green
    CUBE_EDGES: 0x000000, // Black
    ROAD: 0x555555, // Lighter gray for better visibility
    ROAD_LINES: 0xffffff, // White
    STARS: 0xffffff, // White
    BACKGROUND: 0x001155, // Lighter dark blue background
    ZOMBIE: 0xcc0000, // Brighter dark red
    BULLET: 0xff8800, // Orange bullets (more visible)
    OBSTACLE: 0x8B4513, // Brown obstacles
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
    
    // Zombie spawning
    shouldSpawnZombie: () => Math.random() < CONFIG.ZOMBIE_SPAWN_RATE,
    zombieSpawnX: () => (Math.random() - 0.5) * 4, // Across road width
  },
};

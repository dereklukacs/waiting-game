import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Edit3, Check, X, Wifi, WifiOff } from "lucide-react";
import { CONFIG } from "./config";
import { StickPerson } from "./StickPerson";
import { Zombie } from "./Zombie";
import { Bullet } from "./Bullet";
import { Obstacle } from "./Obstacle";
import { useClaudeStatus } from "./hooks/useClaudeStatus";
import { useMultiplayerConnection } from "./hooks/useMultiplayerConnection";
import { GateFactory } from "./gates/GateFactory";
import { BaseGate } from "./gates/BaseGate";
import { WeaponUpgrade } from "./WeaponUpgrade";
import { Coin } from "./Coin";

const App = observer(() => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mobCount, setMobCount] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [forceStarted, setForceStarted] = useState(false);
  const forceStartedRef = useRef(forceStarted);
  const [username, setUsername] = useState<string>("");
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [multiplayerMessage, setMultiplayerMessage] = useState<string>("");
  const [onlinePlayerCount, setOnlinePlayerCount] = useState<number>(0);
  const [deviceId, setDeviceId] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [liveLeaderboard, setLiveLeaderboard] = useState<Array<{username: string, score: number}>>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<Array<{username: string, score: number}>>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [weaponStats, setWeaponStats] = useState({ damage: CONFIG.BULLET_BASE_DAMAGE, bulletVelocity: CONFIG.BULLET_SPEED, rateOfFire: CONFIG.BULLET_RATE });
  const [weaponUpgradeMessage, setWeaponUpgradeMessage] = useState<string>("");
  const [coins, setCoins] = useState<number>(() => {
    const savedCoins = localStorage.getItem("stickrunner-coins");
    const coinCount = savedCoins ? parseInt(savedCoins) || 0 : 0;
    console.log("Loading coins on mount:", coinCount, "from localStorage:", savedCoins);
    return coinCount;
  });
  const [showUpgradeMenu, setShowUpgradeMenu] = useState<boolean>(false);
  const weaponUpgradeRef = useRef<WeaponUpgrade | null>(null);
  const isFirstRender = useRef<boolean>(true);
  const [showClaudeInstructions, setShowClaudeInstructions] = useState<boolean>(false);

  // Get server port from URL params (default to 3001)
  const urlParams = new URLSearchParams(window.location.search);
  const serverPort = parseInt(urlParams.get("serverPort") || "3001");
  const {
    status: claudeStatus,
    isConnected,
    error,
  } = useClaudeStatus(serverPort);
  const claudeStatusRef = useRef(claudeStatus);

  // Multiplayer connection - only connect when username is set
  const {
    isConnected: multiplayerConnected,
    connectionStatus: multiplayerStatus,
    updateScore,
  } = useMultiplayerConnection({
    serverUrl: import.meta.env.PROD
      ? "wss://waiting-game-production.up.railway.app/ws"
      : "ws://localhost:8080/ws",
    username: username && username.trim() ? username : "", // Only pass username if it's valid
    deviceId: deviceId, // Pass device ID for unique identification
    onConnected: () => {
      console.log("Multiplayer connected");
    },
    onRegistered: (data) => {
      console.log("Multiplayer registered:", data);
      setMultiplayerMessage(data.message);
      setTimeout(() => setMultiplayerMessage(""), 3000);
    },
    onPlayerCountUpdate: (count) => {
      setOnlinePlayerCount(count);
    },
    onLiveLeaderboardUpdate: (data) => {
      setLiveLeaderboard(data.entries);
    },
    onAllTimeLeaderboardUpdate: (data) => {
      setAllTimeLeaderboard(data.entries);
    },
    onError: (error) => {
      console.error("Multiplayer error:", error);
      setMultiplayerMessage(`Error: ${error}`);
      setTimeout(() => setMultiplayerMessage(""), 3000);
    },
  });

  // Update ref whenever claudeStatus changes
  useEffect(() => {
    claudeStatusRef.current = claudeStatus;
    // Reset force started when Claude becomes active
    if (
      claudeStatus?.state === "working" ||
      claudeStatus?.state === "tool-executing"
    ) {
      setForceStarted(false);
    }
  }, [claudeStatus]);

  // Update forceStartedRef whenever forceStarted changes
  useEffect(() => {
    forceStartedRef.current = forceStarted;
  }, [forceStarted]);

  // Check for existing username and device ID on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("stickrunner-username");
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      setShowUsernameModal(true);
    }

    // Generate or retrieve device ID
    let savedDeviceId = localStorage.getItem("stickrunner-device-id");
    if (!savedDeviceId) {
      savedDeviceId =
        "device_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 11);
      localStorage.setItem("stickrunner-device-id", savedDeviceId);
    }
    setDeviceId(savedDeviceId);
    
    // Check if Claude integration instructions have been shown
    const claudeInstructionsShown = localStorage.getItem("stickrunner-claude-instructions-shown");
    if (!claudeInstructionsShown) {
      setShowClaudeInstructions(true);
    }
    
    // Coins are now loaded directly in useState initializer
  }, []);

  // Save coins to localStorage whenever they change (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      console.log("Skipping save on first render, coins loaded:", coins);
      return;
    }
    console.log("Saving coins to localStorage:", coins);
    localStorage.setItem("stickrunner-coins", coins.toString());
  }, [coins]);

  // Handle username submission
  const handleUsernameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (usernameInput.trim()) {
      const cleanUsername = usernameInput.trim();
      setUsername(cleanUsername);
      localStorage.setItem("stickrunner-username", cleanUsername);
      setShowUsernameModal(false);
      setEditingUsername(false);
      setUsernameInput("");
    }
  };

  // Handle username edit
  const startEditingUsername = () => {
    setUsernameInput(username);
    setEditingUsername(true);
  };

  const cancelEditingUsername = () => {
    setUsernameInput("");
    setEditingUsername(false);
  };

  // Handle Claude instructions dismissal
  const handleClaudeInstructionsDismiss = () => {
    setShowClaudeInstructions(false);
    localStorage.setItem("stickrunner-claude-instructions-shown", "true");
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Clear any existing content
    mountRef.current.innerHTML = "";

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      CONFIG.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.CAMERA_NEAR,
      CONFIG.CAMERA_FAR
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Add brighter lighting for better visibility and vibrancy
    const ambientLight = new THREE.AmbientLight(0x808080, 0.6); // Much brighter ambient light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Brighter directional light
    directionalLight.position.set(-50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Add additional fill light for more vibrant scene
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(50, 30, -50); // From opposite side
    scene.add(fillLight);

    // Procedural starfield system
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: CONFIG.COLORS.STARS,
      size: CONFIG.STAR_SIZE,
    });
    const starsVertices: number[] = [];
    const starPositions: { x: number; y: number; z: number }[] = [];
    
    // Generate initial stars
    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
      const x = CONFIG.RNG.starPosition();
      const y = CONFIG.RNG.starPosition();
      const z = CONFIG.RNG.starPosition();
      starsVertices.push(x, y, z);
      starPositions.push({ x, y, z });
    }
    
    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    renderer.setClearColor(CONFIG.COLORS.BACKGROUND);

    // Procedural road system
    const roadSegments: THREE.Mesh[] = [];
    const roadLineSegments: THREE.Mesh[] = [];
    const roadSegmentLength = 100; // Length of each road segment
    let nextRoadSegmentZ = 0; // Z position for next road segment
    
    // Create road materials
    const roadMaterial = new THREE.MeshLambertMaterial({
      color: CONFIG.COLORS.ROAD,
    });
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.ROAD_LINES,
    });
    
    const createRoadSegment = (zPosition: number) => {
      // Create road segment
      const roadGeometry = new THREE.PlaneGeometry(CONFIG.ROAD_WIDTH, roadSegmentLength);
      const roadSegment = new THREE.Mesh(roadGeometry, roadMaterial);
      roadSegment.rotation.x = -Math.PI / 2;
      roadSegment.position.y = CONFIG.ROAD_POSITION_Y;
      roadSegment.position.z = zPosition;
      roadSegment.receiveShadow = true;
      scene.add(roadSegment);
      roadSegments.push(roadSegment);
      
      // Create road lines for this segment
      const lineGeometry = new THREE.PlaneGeometry(CONFIG.ROAD_LINE_WIDTH, roadSegmentLength);
      
      // Center line
      const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.y = -1.98;
      centerLine.position.z = zPosition;
      scene.add(centerLine);
      roadLineSegments.push(centerLine);
      
      // Left line
      const leftLine = new THREE.Mesh(lineGeometry, lineMaterial);
      leftLine.rotation.x = -Math.PI / 2;
      leftLine.position.y = -1.98;
      leftLine.position.x = -2.8;
      leftLine.position.z = zPosition;
      scene.add(leftLine);
      roadLineSegments.push(leftLine);
      
      // Right line
      const rightLine = new THREE.Mesh(lineGeometry, lineMaterial);
      rightLine.rotation.x = -Math.PI / 2;
      rightLine.position.y = -1.98;
      rightLine.position.x = 2.8;
      rightLine.position.z = zPosition;
      scene.add(rightLine);
      roadLineSegments.push(rightLine);
    };
    
    // Generate initial road segments
    for (let i = 0; i < 20; i++) {
      createRoadSegment(nextRoadSegmentZ);
      nextRoadSegmentZ -= roadSegmentLength;
    }

    // Create first stick person (player)
    const firstStickPerson = new StickPerson();
    firstStickPerson.setPosition(0, CONFIG.STICK_PERSON_GROUND_Y, 0);
    scene.add(firstStickPerson.group);

    // Keep geometry and material for collision detection (invisible)
    const geometry = new THREE.BoxGeometry(
      CONFIG.CUBE_SIZE,
      CONFIG.CUBE_SIZE,
      CONFIG.CUBE_SIZE
    );
    const material = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.CUBE,
      wireframe: false,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.y = CONFIG.STICK_PERSON_GROUND_Y;
    cube.visible = false; // Hide the collision box
    scene.add(cube);

    // Dynamic gate generation
    const gates: BaseGate[] = [];
    const gateFactory = new GateFactory();
    let nextGateZ = CONFIG.INITIAL_GATE_Z;
    const gateSpacing = CONFIG.GATE_SPACING;

    // Mob system with velocity tracking
    const cubes: THREE.Mesh[] = [cube]; // Start with the main cube (collision box)
    const stickPeople: StickPerson[] = [firstStickPerson]; // Visual stick people
    const dyingStickPeople: StickPerson[] = []; // Stick people playing death animations
    const cubeVelocities: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)]; // Velocity for each cube
    let currentMobCount = 1;

    // Zombie system
    const zombies: Zombie[] = [];

    // Bullet system
    const bullets: Bullet[] = [];

    // Weapon upgrade system
    const weaponUpgrade = new WeaponUpgrade();
    weaponUpgrade.loadFromLocalStorage(); // Load saved upgrades
    weaponUpgradeRef.current = weaponUpgrade;
    
    // Update weapon stats state to reflect loaded upgrades
    setWeaponStats(weaponUpgrade.getStats());

    // Coin system
    const coinsInGame: Coin[] = [];

    // Obstacle system - tied to gate generation
    const obstacles: Obstacle[] = [];
    let obstacleCounter = 0; // Counter to track when to spawn obstacles (every 2 gate pairs)

    // Gate pair tracking
    const triggeredPairs = new Set<string>();

    // Magnetic point controls (invisible point that all cubes are attracted to)
    const magnetPoint = new THREE.Vector3(0, CONFIG.STICK_PERSON_GROUND_Y, 0); // Starting position
    let targetX = 0;
    const maxSpeed = CONFIG.MAGNETIC_POINT_MAX_SPEED;
    const roadBounds = CONFIG.ROAD_BOUNDS;
    let isDragging = false;
    let lastMouseX = 0;

    const createGatePair = (zPosition: number) => {
      const gatePair = gateFactory.createGatePair(zPosition, currentLevel);
      
      gatePair.forEach(gate => {
        scene.add(gate.group);
        gates.push(gate);
      });
    };

    // No initial gates - all gates will be generated programmatically

    // Position camera for perspective view
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 0, -10);

    // Mouse event handlers
    const handleMouseDown = (event: MouseEvent) => {
      isDragging = true;
      lastMouseX = event.clientX;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = event.clientX - lastMouseX;
      const sensitivity = 0.01;
      targetX += deltaX * sensitivity;

      // Clamp to road bounds
      targetX = Math.max(-roadBounds, Math.min(roadBounds, targetX));

      lastMouseX = event.clientX;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    // Keyboard event handlers
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        // Make all stick people jump
        stickPeople.forEach((stickPerson) => {
          stickPerson.jump();
        });
      }
    };

    // Add event listeners
    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    // Animation loop
    let animationId: number;
    let gameRunning = true;
    let gamePaused = false;
    let gameTimeSeconds = 0; // Track game time in seconds
    let lastFrameTime = performance.now();
    const animate = (currentTime: number = performance.now()) => {
      if (!gameRunning) return; // Stop animation if game over

      // Check if game should be paused based on Claude status (use ref for current value)
      // Allow force start to override pause for idle/waiting-permission states
      gamePaused =
        !forceStartedRef.current &&
        (claudeStatusRef.current?.state === "idle" ||
          claudeStatusRef.current?.state === "waiting-permission");

      if (gamePaused) {
        // If paused, keep checking for unpause but don't update lastFrameTime
        setTimeout(() => animate(), 100);
        return;
      }

      // Calculate delta time for consistent speed across devices
      const deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
      lastFrameTime = currentTime;
      gameTimeSeconds += deltaTime;

      animationId = requestAnimationFrame(animate);

      // Calculate current level based on game time (20 second intervals)
      const gameTime20Seconds = gameTimeSeconds / 20;
      const newLevel = Math.floor(gameTime20Seconds) + 1;
      
      // Update level if it changed
      if (newLevel !== currentLevel) {
        setCurrentLevel(newLevel);
      }
      
      // Calculate speed multiplier based on level
      const speedMultiplier = Math.min(
        1 + ((newLevel - 1) * CONFIG.SPEED_INCREASE_RATE),
        CONFIG.MAX_SPEED_MULTIPLIER
      );

      // Move camera forward along the road (delta time based with speed multiplier)
      const cameraSpeed = CONFIG.CAMERA_SPEED * 60 * deltaTime * speedMultiplier;
      camera.position.z -= cameraSpeed;
      camera.lookAt(
        0,
        0,
        camera.position.z - CONFIG.CAMERA_LOOK_AHEAD_DISTANCE
      );

      // Update magnetic point position
      magnetPoint.z -= cameraSpeed; // Move forward with camera

      // Smooth magnetic point movement based on mouse input (delta time based)
      // Increase movement speed with level progression
      const movementSpeedMultiplier = Math.min(
        1 + ((newLevel - 1) * CONFIG.MAGNETIC_POINT_SPEED_INCREASE_RATE),
        CONFIG.MAGNETIC_POINT_MAX_MULTIPLIER
      );
      const dynamicMaxSpeed = maxSpeed * movementSpeedMultiplier;
      
      const deltaX = targetX - magnetPoint.x;
      const moveSpeed = dynamicMaxSpeed * 60 * deltaTime; // Convert to per-second speed
      const moveStep = Math.sign(deltaX) * Math.min(Math.abs(deltaX), moveSpeed);
      magnetPoint.x += moveStep;

      // Procedural road generation - generate new segments ahead
      if (camera.position.z < nextRoadSegmentZ + 500) {
        createRoadSegment(nextRoadSegmentZ);
        nextRoadSegmentZ -= roadSegmentLength;
      }

      // Cleanup old road segments behind camera
      for (let i = roadSegments.length - 1; i >= 0; i--) {
        const roadSegment = roadSegments[i];
        if (roadSegment.position.z > camera.position.z + 200) {
          scene.remove(roadSegment);
          roadSegment.geometry.dispose();
          (roadSegment.material as THREE.Material).dispose();
          roadSegments.splice(i, 1);
        }
      }

      // Cleanup old road line segments behind camera
      for (let i = roadLineSegments.length - 1; i >= 0; i--) {
        const lineSegment = roadLineSegments[i];
        if (lineSegment.position.z > camera.position.z + 200) {
          scene.remove(lineSegment);
          lineSegment.geometry.dispose();
          (lineSegment.material as THREE.Material).dispose();
          roadLineSegments.splice(i, 1);
        }
      }

      // Procedural star generation - move stars that are behind camera to the front
      const starsPositionAttribute = starsGeometry.getAttribute('position');
      let starsUpdated = false;
      
      for (let i = 0; i < starPositions.length; i++) {
        const star = starPositions[i];
        if (star.z > camera.position.z + 100) {
          // Move star to front of camera
          star.z = camera.position.z - CONFIG.STAR_SPREAD / 2 - Math.random() * CONFIG.STAR_SPREAD / 2;
          star.x = CONFIG.RNG.starPosition();
          star.y = CONFIG.RNG.starPosition();
          
          // Update vertex buffer
          starsPositionAttribute.setXYZ(i, star.x, star.y, star.z);
          starsUpdated = true;
        }
      }
      
      if (starsUpdated) {
        starsPositionAttribute.needsUpdate = true;
      }

      // Generate new gate pairs ahead with consistent spacing
      if (camera.position.z < nextGateZ + 30) {
        createGatePair(nextGateZ);
        nextGateZ -= gateSpacing; // Move to next gate position

        // Spawn obstacle every 2 gate pairs, centered in road halves
        obstacleCounter++;
        if (obstacleCounter >= 2) {
          obstacleCounter = 0;

          // Position obstacle between the current and next gate
          const obstacleZ = nextGateZ + gateSpacing / 2;

          // Choose either left half (-1.5) or right half (1.5) of road randomly
          const roadHalfCenter = Math.random() < 0.5 ? -1.5 : 1.5;

          const newObstacle = new Obstacle(roadHalfCenter, obstacleZ);
          scene.add(newObstacle.mesh);
          obstacles.push(newObstacle);
        }
      }

      // Spawn zombies with increasing difficulty based on level
      const spawnRateMultiplier = 1 + ((newLevel - 1) * CONFIG.ZOMBIE_SPAWN_RATE_INCREASE);
      const currentSpawnRate = CONFIG.ZOMBIE_SPAWN_RATE * spawnRateMultiplier;
      
      // Linear health progression: mix of different health levels for smooth difficulty
      const baseHealthFloat = CONFIG.ZOMBIE_BASE_HEALTH + ((newLevel - 1) * CONFIG.ZOMBIE_HEALTH_INCREASE_RATE);
      const baseHealthInt = Math.floor(baseHealthFloat);
      const healthFraction = baseHealthFloat - baseHealthInt;
      
      // Probabilistically choose between current and next health level for smooth progression
      const zombieHealth = Math.max(1, 
        Math.random() < healthFraction ? baseHealthInt + 1 : baseHealthInt
      );
      
      if (Math.random() < currentSpawnRate) {
        const newZombie = new Zombie(zombieHealth);
        newZombie.setPosition(
          CONFIG.RNG.zombieSpawnX(),
          -1,
          camera.position.z + CONFIG.ZOMBIE_SPAWN_DISTANCE
        );
        scene.add(newZombie.group);
        zombies.push(newZombie);
      }

      // Check gate collisions with individual challengers
      for (let i = gates.length - 1; i >= 0; i--) {
        const gate = gates[i];

        // Check each challenger individually for gate collision
        for (let cubeIndex = cubes.length - 1; cubeIndex >= 0; cubeIndex--) {
          const testCube = cubes[cubeIndex];
          const cubeId = `${gate.pairId}_${cubeIndex}`;

          // Check if this specific cube has already triggered this gate
          if (!triggeredPairs.has(cubeId)) {
            // Check if cube is passing through the gate
            if (gate.checkCollision(testCube.position)) {
              // Mark this cube as having triggered this gate
              triggeredPairs.add(cubeId);

              // Apply gate effect
              const result = gate.applyEffect(
                cubeIndex,
                cubes,
                stickPeople,
                scene,
                geometry,
                material,
                cubeVelocities
              );

              currentMobCount += result.mobCountChange;
              
              if (result.shouldRemove) {
                // Handle dying stick person for death animation
                const stickPerson = stickPeople[cubeIndex];
                if (stickPerson && !stickPerson.isDying && !stickPerson.isFalling) {
                  stickPerson.startDying();
                  dyingStickPeople.push(stickPerson);
                }
                
                cubes.splice(cubeIndex, 1);
                cubeVelocities.splice(cubeIndex, 1);
                stickPeople.splice(cubeIndex, 1);
              }
              
              setMobCount(currentMobCount);

              // Check for game over
              if (cubes.length === 0) {
                gameRunning = false;
                setGameOver(true);
              }
            }
          }
        }

        // Remove gates that are far behind and clean up triggered pairs
        if (gate.group.position.z > camera.position.z + CONFIG.GATE_CLEANUP_DISTANCE) {
          // Clean up all triggered pairs for this gate
          const keysToDelete = Array.from(triggeredPairs).filter((key) =>
            key.toString().startsWith(gate.pairId.toString())
          );
          keysToDelete.forEach((key) => triggeredPairs.delete(key));

          scene.remove(gate.group);
          gate.dispose();
          gates.splice(i, 1);
        }
      }

      // Update zombies - move toward camera and check collisions
      for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];

        // Animate zombie (faster with speed multiplier)
        zombie.animate(deltaTime * speedMultiplier);

        // Move zombie toward camera (but slower than camera speed) with speed multiplier
        const zombieSpeed = CONFIG.ZOMBIE_SPEED * 60 * deltaTime * speedMultiplier;
        zombie.group.position.z += zombieSpeed;

        // Check bullet collisions with this zombie
        let zombieHit = false;
        for (let k = bullets.length - 1; k >= 0; k--) {
          const bullet = bullets[k];
          const bulletDistance = bullet
            .getPosition()
            .distanceTo(zombie.getPosition());

          if (bulletDistance < CONFIG.BULLET_DAMAGE_DISTANCE) {
            // Bullet hit zombie - damage it
            console.log(`Zombie hit! Distance: ${bulletDistance.toFixed(2)}, Health: ${zombie.health}`);
            scene.remove(bullet.mesh);
            bullet.dispose();
            bullets.splice(k, 1);

            // Damage the zombie
            const zombieDied = zombie.takeDamage(bullet.damage);
            
            if (zombieDied) {
              // Zombie died - remove it and increment score
              const zombiePosition = zombie.group.position.clone();
              scene.remove(zombie.group);
              zombie.dispose();
              zombies.splice(i, 1);
              
              // Drop coin with chance
              if (Math.random() < CONFIG.COIN_DROP_CHANCE) {
                const coinPosition = new THREE.Vector3(
                  zombiePosition.x + (Math.random() - 0.5) * 0.5,
                  CONFIG.STICK_PERSON_GROUND_Y + 0.1,
                  zombiePosition.z
                );
                const newCoin = new Coin(coinPosition);
                scene.add(newCoin.mesh);
                coinsInGame.push(newCoin);
              }
              
              // Increment score for killing a zombie
              setScore(prevScore => {
                const newScore = prevScore + 1;
                // Send score update to server
                if (updateScore) {
                  updateScore(newScore);
                }
                
                // Automatic upgrades removed - now use coin purchase system
                
                return newScore;
              });
              
              zombieHit = true;
            }
            break;
          }
        }

        // Skip collision check if zombie was destroyed by bullet
        if (zombieHit) continue;

        // Check collisions with stick people
        for (let j = stickPeople.length - 1; j >= 0; j--) {
          const stickPerson = stickPeople[j];
          const distance = zombie
            .getPosition()
            .distanceTo(stickPerson.getPosition());

          if (distance < CONFIG.ZOMBIE_COLLISION_DISTANCE) {
            // Zombie caught a stick person - remove both the stick person and cube
            currentMobCount--;

            // Trigger death animation for stick person
            if (!stickPerson.isDying && !stickPerson.isFalling) {
              stickPerson.startDying();
              dyingStickPeople.push(stickPerson);
            }

            // Remove corresponding cube
            const correspondingCube = cubes[j];
            if (correspondingCube) {
              scene.remove(correspondingCube);
              correspondingCube.geometry.dispose();
              (correspondingCube.material as THREE.Material).dispose();
              cubes.splice(j, 1);
              cubeVelocities.splice(j, 1);
            }
            
            // Remove stick person from array
            stickPeople.splice(j, 1);

            setMobCount(currentMobCount);

            // Check for game over
            if (cubes.length === 0) {
              gameRunning = false;
              setGameOver(true);
            }

            break; // Zombie can only catch one person at a time
          }
        }

        // Remove zombies that are too far behind camera
        if (
          zombie.group.position.z >
          camera.position.z + CONFIG.ZOMBIE_CLEANUP_DISTANCE
        ) {
          scene.remove(zombie.group);
          zombie.dispose();
          zombies.splice(i, 1);
        }
      }

      // Update obstacles and check collisions
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];

        // Check collisions with stick people
        for (let j = stickPeople.length - 1; j >= 0; j--) {
          const stickPerson = stickPeople[j];

          if (obstacle.checkCollision(stickPerson.getPosition())) {
            // Obstacle hit stick person - remove the stick person
            currentMobCount--;

            // Trigger death animation for stick person
            if (!stickPerson.isDying && !stickPerson.isFalling) {
              stickPerson.startDying();
              dyingStickPeople.push(stickPerson);
            }

            // Remove corresponding cube
            const correspondingCube = cubes[j];
            if (correspondingCube) {
              scene.remove(correspondingCube);
              correspondingCube.geometry.dispose();
              (correspondingCube.material as THREE.Material).dispose();
              cubes.splice(j, 1);
              cubeVelocities.splice(j, 1);
            }
            
            // Remove stick person from array
            stickPeople.splice(j, 1);

            setMobCount(currentMobCount);

            // Check for game over
            if (cubes.length === 0) {
              gameRunning = false;
              setGameOver(true);
            }

            break; // Obstacle can only hit one person at a time
          }
        }

        // Remove obstacles that are too far behind camera
        if (
          obstacle.mesh.position.z >
          camera.position.z + CONFIG.OBSTACLE_CLEANUP_DISTANCE
        ) {
          scene.remove(obstacle.mesh);
          obstacle.dispose();
          obstacles.splice(i, 1);
        }
      }

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        // Update bullet position and check if it should be removed
        const stillActive = bullet.update(deltaTime, speedMultiplier);

        if (!stillActive) {
          // Remove bullet that has traveled too far
          scene.remove(bullet.mesh);
          bullet.dispose();
          bullets.splice(i, 1);
        }
      }

      // Update coins - animate and check for collection
      for (let i = coinsInGame.length - 1; i >= 0; i--) {
        const coin = coinsInGame[i];
        
        if (coin.isCollected()) {
          // Remove collected coin
          scene.remove(coin.mesh);
          coin.dispose();
          coinsInGame.splice(i, 1);
          continue;
        }
        
        // Animate coin
        coin.animate(deltaTime);
        
        // Check collection against all stick people
        for (let j = 0; j < stickPeople.length; j++) {
          const stickPerson = stickPeople[j];
          if (stickPerson && !stickPerson.isFalling && !stickPerson.isDying) {
            if (coin.checkCollision(stickPerson.getPosition())) {
              coin.collect();
              setCoins(prevCoins => prevCoins + 1);
              
              // Remove coin from scene
              scene.remove(coin.mesh);
              coin.dispose();
              coinsInGame.splice(i, 1);
              break;
            }
          }
        }
        
        // Clean up coins that are too far behind
        if (coin.shouldCleanup(camera.position.z)) {
          scene.remove(coin.mesh);
          coin.dispose();
          coinsInGame.splice(i, 1);
        }
      }

      // Update ALL cubes with proper velocity-based physics
      for (let index = cubes.length - 1; index >= 0; index--) {
        const mobCube = cubes[index];
        // Update corresponding stick person animation
        const stickPerson = stickPeople[index];
        if (stickPerson) {
          stickPerson.animate(deltaTime * speedMultiplier);

          // Handle shooting (auto-shoot)
          if (stickPerson.canShoot()) {
            const bulletPosition = stickPerson.shoot(weaponUpgrade.getStats());
            if (bulletPosition) {
              const newBullet = new Bullet(bulletPosition, weaponUpgrade.getStats());
              scene.add(newBullet.mesh);
              bullets.push(newBullet);
            }
          }

          // Check if stick person has fallen off the road
          if (
            !stickPerson.isFalling &&
            (mobCube.position.x < CONFIG.ROAD_BOUNDARY_LEFT ||
              mobCube.position.x > CONFIG.ROAD_BOUNDARY_RIGHT)
          ) {
            stickPerson.startFalling();
          }

          // Remove stick person if it has fallen too far
          if (
            stickPerson.isFalling &&
            stickPerson.getPosition().y < CONFIG.FALL_CLEANUP_Y
          ) {
            currentMobCount--;

            // Don't trigger death animation for falling figures - they should just be removed
            // The falling animation will continue until removal

            // Remove corresponding cube
            scene.remove(mobCube);
            mobCube.geometry.dispose();
            (mobCube.material as THREE.Material).dispose();
            cubes.splice(index, 1);
            cubeVelocities.splice(index, 1);
            
            // Remove stick person from scene and array immediately
            scene.remove(stickPerson.group);
            stickPerson.dispose();
            stickPeople.splice(index, 1);

            setMobCount(currentMobCount);

            // Check for game over
            if (cubes.length === 0) {
              gameRunning = false;
              setGameOver(true);
            }

            continue; // Skip physics processing for removed cube
          }
        }

        // Skip physics for falling stick people - they just fall
        if (stickPerson && stickPerson.isFalling) {
          continue;
        }

        // Move forward with camera
        mobCube.position.z -= cameraSpeed;

        // Get this cube's velocity
        const velocity = cubeVelocities[index];

        // Calculate forces (much gentler)
        let forceX = 0;
        let forceZ = 0;

        // Attraction to magnetic point
        const attractionStrength = CONFIG.ATTRACTION_STRENGTH;
        const dx = magnetPoint.x - mobCube.position.x;
        const dz = magnetPoint.z - mobCube.position.z;
        const distanceToMagnet = Math.sqrt(dx * dx + dz * dz);

        if (distanceToMagnet > CONFIG.ATTRACTION_MIN_DISTANCE) {
          forceX += dx * attractionStrength;
          forceZ += dz * attractionStrength;
        }

        // Multi-layer collision avoidance
        cubes.forEach((otherCube, otherIndex) => {
          if (otherCube !== mobCube && otherIndex !== index) {
            const deltaX = mobCube.position.x - otherCube.position.x;
            const deltaZ = mobCube.position.z - otherCube.position.z;
            const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

            // Hard collision prevention (very close)
            const minDistance = CONFIG.HARD_REPULSION_MIN_DISTANCE;
            if (distance < minDistance && distance > 0.1) {
              const hardRepulsion = CONFIG.HARD_REPULSION_STRENGTH;
              const repulsionForce =
                (hardRepulsion * (minDistance - distance)) / minDistance;
              forceX += (deltaX / distance) * repulsionForce;
              forceZ += (deltaZ / distance) * repulsionForce;
            }

            // Soft spacing (comfortable distance)
            const comfortDistance = CONFIG.SOFT_REPULSION_COMFORT_DISTANCE;
            if (distance < comfortDistance && distance > minDistance) {
              const softRepulsion = CONFIG.SOFT_REPULSION_STRENGTH;
              const repulsionForce =
                (softRepulsion * (comfortDistance - distance)) /
                comfortDistance;
              forceX += (deltaX / distance) * repulsionForce;
              forceZ += (deltaZ / distance) * repulsionForce;
            }
          }
        });

        // Apply forces to velocity (not position) - delta time based
        const deltaTimePhysics = deltaTime * 60; // Convert to consistent physics timestep
        velocity.x += forceX * deltaTimePhysics;
        velocity.z += forceZ * deltaTimePhysics;

        // Apply damping to prevent oscillations
        const damping = Math.pow(CONFIG.VELOCITY_DAMPING, deltaTime * 60);
        velocity.x *= damping;
        velocity.z *= damping;

        // Limit velocity to prevent crazy speeds
        const maxSpeed = CONFIG.MAX_VELOCITY;
        const currentSpeed = Math.sqrt(
          velocity.x * velocity.x + velocity.z * velocity.z
        );
        if (currentSpeed > maxSpeed) {
          velocity.x = (velocity.x / currentSpeed) * maxSpeed;
          velocity.z = (velocity.z / currentSpeed) * maxSpeed;
        }

        // Apply velocity to position (delta time based)
        mobCube.position.x += velocity.x * deltaTimePhysics;
        mobCube.position.z += velocity.z * deltaTimePhysics;

        // Sync stick person position with collision box (only if not falling)
        if (stickPerson && !stickPerson.isFalling) {
          stickPerson.setPosition(
            mobCube.position.x,
            mobCube.position.y,
            mobCube.position.z
          );
        }

        // Final collision correction - push apart any overlapping cubes
        cubes.forEach((otherCube, otherIndex) => {
          if (otherCube !== mobCube && otherIndex !== index) {
            const deltaX = mobCube.position.x - otherCube.position.x;
            const deltaZ = mobCube.position.z - otherCube.position.z;
            const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
            const minSeparation = CONFIG.COLLISION_MIN_SEPARATION; // Minimum allowed distance

            if (distance < minSeparation && distance > 0.01) {
              const correction = (minSeparation - distance) * 0.5; // Split the correction
              const correctionX = (deltaX / distance) * correction;
              const correctionZ = (deltaZ / distance) * correction;

              mobCube.position.x += correctionX;
              mobCube.position.z += correctionZ;
            }
          }
        });

        // Keep cubes on the road surface
        mobCube.position.y = CONFIG.STICK_PERSON_GROUND_Y;
      }

      // Animate dying stick people and clean up completed death animations
      for (let i = dyingStickPeople.length - 1; i >= 0; i--) {
        const stickPerson = dyingStickPeople[i];
        if (stickPerson) {
          stickPerson.animate(deltaTime);
          
          // Remove if death animation is complete
          if (stickPerson.isDeathAnimationComplete()) {
            scene.remove(stickPerson.group);
            stickPerson.dispose();
            dyingStickPeople.splice(i, 1);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Restart function
    const restartGame = () => {
      setGameOver(false);
      setMobCount(1);
      gameRunning = true;

      // Clear all existing gates
      gates.forEach((gate) => {
        scene.remove(gate.group);
        gate.dispose();
      });
      gates.length = 0;

      // Clear all zombies
      zombies.forEach((zombie) => {
        scene.remove(zombie.group);
        zombie.dispose();
      });
      zombies.length = 0;

      // Clear all bullets
      bullets.forEach((bullet) => {
        scene.remove(bullet.mesh);
        bullet.dispose();
      });
      bullets.length = 0;

      // Clear all obstacles
      obstacles.forEach((obstacle) => {
        scene.remove(obstacle.mesh);
        obstacle.dispose();
      });
      obstacles.length = 0;
      obstacleCounter = 0;

      // Clear all coins
      coinsInGame.forEach((coin) => {
        scene.remove(coin.mesh);
        coin.dispose();
      });
      coinsInGame.length = 0;

      // Clear all challengers and stick people
      while (cubes.length > 0) {
        const removedCube = cubes.pop();
        const removedStickPerson = stickPeople.pop();
        cubeVelocities.pop();

        if (removedCube) {
          scene.remove(removedCube);
          removedCube.geometry.dispose();
          (removedCube.material as THREE.Material).dispose();
        }

        if (removedStickPerson) {
          scene.remove(removedStickPerson.group);
          removedStickPerson.dispose();
        }
      }

      // Clear all dying stick people
      while (dyingStickPeople.length > 0) {
        const removedStickPerson = dyingStickPeople.pop();
        if (removedStickPerson) {
          scene.remove(removedStickPerson.group);
          removedStickPerson.dispose();
        }
      }

      // Recreate the first cube (invisible collision box)
      const newCube = new THREE.Mesh(geometry, material);
      newCube.visible = false;
      newCube.position.set(0, CONFIG.STICK_PERSON_GROUND_Y, 0);
      scene.add(newCube);
      cubes.push(newCube);
      cubeVelocities.push(new THREE.Vector3(0, 0, 0));

      // Recreate the first stick person
      const newStickPerson = new StickPerson();
      newStickPerson.setPosition(0, CONFIG.STICK_PERSON_GROUND_Y, 0);
      scene.add(newStickPerson.group);
      stickPeople.push(newStickPerson);

      // Reset procedural road system
      roadSegments.forEach((segment) => {
        scene.remove(segment);
        segment.geometry.dispose();
        (segment.material as THREE.Material).dispose();
      });
      roadSegments.length = 0;
      
      roadLineSegments.forEach((segment) => {
        scene.remove(segment);
        segment.geometry.dispose();
        (segment.material as THREE.Material).dispose();
      });
      roadLineSegments.length = 0;
      
      // Regenerate road segments
      nextRoadSegmentZ = 0;
      for (let i = 0; i < 20; i++) {
        createRoadSegment(nextRoadSegmentZ);
        nextRoadSegmentZ -= roadSegmentLength;
      }

      // Reset star positions
      const starsPositionAttribute = starsGeometry.getAttribute('position');
      for (let i = 0; i < starPositions.length; i++) {
        const x = CONFIG.RNG.starPosition();
        const y = CONFIG.RNG.starPosition();
        const z = CONFIG.RNG.starPosition();
        starPositions[i] = { x, y, z };
        starsPositionAttribute.setXYZ(i, x, y, z);
      }
      starsPositionAttribute.needsUpdate = true;

      // Reset camera and magnetic point to starting positions
      camera.position.set(0, 3, 8);
      camera.lookAt(0, 0, -10);
      magnetPoint.set(0, CONFIG.STICK_PERSON_GROUND_Y, 0);
      targetX = 0;
      currentMobCount = 1;

      // Reset gate generation system
      nextGateZ = -30;

      // Clear triggered pairs
      triggeredPairs.clear();
      
      // Reset weapon upgrade message and menu (but NOT upgrades - they persist)
      setWeaponUpgradeMessage("");
      setShowUpgradeMenu(false);
      
      // Reset score, level, and game time
      setScore(0);
      setCurrentLevel(1);
      // NOTE: Coins are NOT reset - they persist between games
      gameTimeSeconds = 0;
      lastFrameTime = performance.now();
      
      // Send reset score to server
      if (updateScore) {
        updateScore(0);
      }

      // Restart animation
      animate();
    };

    // Expose restart function to window for the button
    (window as any).restartGame = restartGame;

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      delete (window as any).restartGame;
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={mountRef} className="w-full h-screen" />
      <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg">
        {editingUsername ? (
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="text-sm px-2 py-1 rounded text-white bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              maxLength={20}
              autoFocus
              onKeyDown={(e) => e.key === "Escape" && cancelEditingUsername()}
            />
            <button
              type="button"
              onClick={handleUsernameSubmit}
              className="text-green-400 hover:text-green-300 transition-colors"
              title="Save"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={cancelEditingUsername}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Cancel"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-1 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors mb-1"
            onClick={startEditingUsername}
            title="Click to edit username"
          >
            <span>{username}</span>
            <Edit3 size={14} />
          </div>
        )}
        <div className="text-xl font-bold">Challengers: {mobCount}</div>
        <div className="text-lg font-semibold text-yellow-400">Score: {score}</div>
        <div className="text-md font-medium text-blue-400">Level: {currentLevel}</div>
        <div className="text-md font-medium text-yellow-600">Coins: {coins}</div>
        
        {/* Weapon Stats */}
        <div className="mt-2 text-sm">
          <div className="text-orange-400 font-medium">Weapon Stats:</div>
          <div className="text-xs text-gray-300 space-y-1">
            <div>Damage: {weaponStats.damage}</div>
            <div>Velocity: {weaponStats.bulletVelocity.toFixed(2)}</div>
            <div>Rate: {(60 / weaponStats.rateOfFire).toFixed(1)}/s</div>
          </div>
        </div>
        
        {/* Movement Speed Display */}
        <div className="mt-2 text-sm">
          <div className="text-green-400 font-medium">Movement:</div>
          <div className="text-xs text-gray-300">
            Speed: {Math.min(
              1 + ((currentLevel - 1) * CONFIG.MAGNETIC_POINT_SPEED_INCREASE_RATE),
              CONFIG.MAGNETIC_POINT_MAX_MULTIPLIER
            ).toFixed(1)}x
          </div>
        </div>
      </div>

      {/* Status Display */}
      <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg space-y-3">
        {/* Claude Status */}
        <div>
          <div className="text-sm font-semibold mb-1">Claude Status</div>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  claudeStatus?.state === "idle"
                    ? "bg-green-500"
                    : claudeStatus?.state === "working"
                    ? "bg-yellow-500"
                    : claudeStatus?.state === "tool-executing"
                    ? "bg-red-500"
                    : claudeStatus?.state === "waiting-permission"
                    ? "bg-blue-500"
                    : "bg-gray-500"
                }`}
              ></div>
              <span className="text-sm capitalize">
                {claudeStatus?.state === "tool-executing"
                  ? "Tool Running"
                  : claudeStatus?.state === "waiting-permission"
                  ? "Waiting Permission"
                  : claudeStatus?.state || "Unknown"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-sm text-red-300">
                {error ? "Connection Error" : "Connecting..."}
              </span>
            </div>
          )}
        </div>

        {/* Multiplayer Status */}
        <div>
          <div className="text-sm font-semibold mb-1">Multiplayer</div>
          <div className="flex items-center gap-2">
            {multiplayerConnected ? (
              <Wifi size={14} className="text-green-400" />
            ) : (
              <WifiOff size={14} className="text-red-400" />
            )}
            <span className="text-sm capitalize">
              {multiplayerStatus === "registered"
                ? "Online"
                : multiplayerStatus === "connected"
                ? "Connecting..."
                : multiplayerStatus === "connecting"
                ? "Connecting..."
                : "Offline"}
            </span>
          </div>
          {multiplayerConnected && (
            <div className="text-xs text-gray-300 mt-1">
              {onlinePlayerCount} player{onlinePlayerCount !== 1 ? "s" : ""}{" "}
              online
            </div>
          )}
          {multiplayerMessage && (
            <div className="text-xs text-gray-300 mt-1 max-w-48 truncate">
              {multiplayerMessage}
            </div>
          )}
          {weaponUpgradeMessage && (
            <div className="text-xs text-orange-400 mt-1 font-bold animate-pulse">
              {weaponUpgradeMessage}
            </div>
          )}
        </div>

        {/* Live Leaderboard */}
        {multiplayerConnected && liveLeaderboard.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-1">Live Leaderboard</div>
            <div className="space-y-1">
              {liveLeaderboard.slice(0, 5).map((entry, index) => (
                <div key={entry.username} className="flex justify-between text-xs">
                  <span className={`${entry.username === username ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>
                    {index + 1}. {entry.username}
                  </span>
                  <span className="text-white">{entry.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All-Time Leaderboard */}
        {multiplayerConnected && allTimeLeaderboard.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-1">All-Time Best</div>
            <div className="space-y-1">
              {allTimeLeaderboard.slice(0, 5).map((entry, index) => (
                <div key={entry.username} className="flex justify-between text-xs">
                  <span className={`${entry.username === username ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}>
                    {index + 1}. {entry.username}
                  </span>
                  <span className="text-white">{entry.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Game Paused Overlay */}
      {!forceStarted &&
        (claudeStatus?.state === "idle" ||
          claudeStatus?.state === "waiting-permission") && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 text-center shadow-lg">
              {claudeStatus?.state === "idle" ? (
                <>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">
                    Game Complete!
                  </h2>
                  <p className="text-gray-700 mb-2">
                    <strong>Final Score: {score}</strong>
                  </p>
                  <p className="text-gray-700 mb-4">
                    Claude Code is done working. To play for longer, give it a better prompt!
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-blue-600 mb-2">
                    Game Paused
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Claude needs permission - check your terminal!
                  </p>
                </>
              )}
              <div className="space-y-3">
                <button
                  onClick={() => (window as any).restartGame?.()}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Play Again
                </button>
                {window.location.hostname === 'localhost' && (
                  <button
                    onClick={() => setForceStarted(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors"
                  >
                    Force Start Game
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Username Modal */}
      {showUsernameModal && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome to Stick Runner!
            </h2>
            <p className="text-gray-600 mb-6">
              Choose a username to get started:
            </p>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={20}
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                disabled={!usernameInput.trim()}
              >
                Start Playing
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Claude Integration Instructions Modal */}
      {showClaudeInstructions && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center max-w-md mx-4">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">
              🤖 Claude Code Integration
            </h2>
            <div className="text-gray-700 space-y-3">
              <p className="text-sm">
                Run these commands in your terminal to modify the game with AI assistance:
              </p>
              <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                <div><code>npx waiting-game@latest setup</code></div>
                <div><code>npx waiting-game@latest start</code></div>
              </div>
              <p className="text-xs text-gray-500">
                The game pauses when Claude is working. Check the status in the top-right corner.
              </p>
            </div>
            
            <button
              onClick={handleClaudeInstructionsDismiss}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 text-center max-w-md w-full mx-4">
            <h2 className="text-4xl font-bold text-red-600 mb-4">Game Over!</h2>
            <p className="text-xl text-gray-700 mb-2">
              All your challengers were eliminated!
            </p>
            <p className="text-lg text-gray-600 mb-6">
              Final Score: {score} | Coins: {coins}
            </p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowUpgradeMenu(!showUpgradeMenu)}
                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
              >
                {showUpgradeMenu ? "Hide" : "Show"} Upgrades
              </button>
              <button
                onClick={() => {
                  setShowUpgradeMenu(false);
                  (window as any).restartGame?.();
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Restart Game
              </button>
            </div>
            
            {showUpgradeMenu && (
              <div className="mt-6 text-left">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Weapon Upgrades</h3>
                <div className="space-y-3">
                  {weaponUpgradeRef.current?.getUpgradeInfo().map((upgrade, index) => {
                    const upgradeTypes: ('damage' | 'bulletVelocity' | 'rateOfFire')[] = ['damage', 'bulletVelocity', 'rateOfFire'];
                    const upgradeType = upgradeTypes[index];
                    const canPurchase = weaponUpgradeRef.current?.canPurchaseUpgrade(upgradeType, coins) || false;
                    
                    return (
                      <div key={upgrade.name} className="border rounded p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800">{upgrade.name}</h4>
                            <p className="text-sm text-gray-600">{upgrade.description}</p>
                            <p className="text-xs text-gray-500">
                              Level {upgrade.currentLevel}/{upgrade.maxLevel}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-yellow-600">
                              {upgrade.cost} coins
                            </p>
                            <button
                              onClick={() => {
                                if (weaponUpgradeRef.current) {
                                  const result = weaponUpgradeRef.current.purchaseUpgrade(upgradeType, coins);
                                  if (result.success) {
                                    setCoins(result.newCoinCount);
                                    setWeaponStats(weaponUpgradeRef.current.getStats());
                                  }
                                }
                              }}
                              disabled={!canPurchase}
                              className={`mt-1 px-3 py-1 rounded text-sm font-semibold ${
                                canPurchase
                                  ? 'bg-green-500 hover:bg-green-700 text-white'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {upgrade.currentLevel >= upgrade.maxLevel ? 'MAX' : 'Buy'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }) || []}
                </div>
                
                {/* Reset All Upgrades Button */}
                <div className="mt-4 pt-3 border-t">
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all weapon upgrades? This cannot be undone.')) {
                        if (weaponUpgradeRef.current) {
                          weaponUpgradeRef.current.reset();
                          weaponUpgradeRef.current.saveToLocalStorage();
                          setWeaponStats(weaponUpgradeRef.current.getStats());
                        }
                      }
                    }}
                    className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
                  >
                    Reset All Upgrades
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Instructions */}
      <div className="absolute bottom-4 left-4 bg-black/60 text-white px-4 py-3 rounded-lg text-sm max-w-xs">
        <div className="font-bold mb-2">How to Play:</div>
        <div className="space-y-1">
          <div>• Drag mouse to move left/right</div>
          <div>• Spacebar to jump over obstacles</div>
          <div>• Go through blue gates (add challengers)</div>
          <div>• Avoid red gates (remove challengers)</div>
          <div>• Shoot zombies automatically</div>
          <div>• Don't let all challengers get eliminated!</div>
        </div>
      </div>

      {/* NPX Commands */}
      <div className="absolute bottom-4 right-4 bg-black/60 text-white px-4 py-3 rounded-lg text-sm max-w-xs">
        <div className="font-bold mb-2">Setup Commands:</div>
        <div className="space-y-1 font-mono text-xs">
          <div><code className="bg-gray-700 px-1 rounded">npx waiting-game@latest setup</code></div>
          <div><code className="bg-gray-700 px-1 rounded">npx waiting-game@latest start</code></div>
        </div>
      </div>
    </div>
  );
});

export default App;

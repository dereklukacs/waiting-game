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

const App = observer(() => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mobCount, setMobCount] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [forceStarted, setForceStarted] = useState(false);
  const forceStartedRef = useRef(forceStarted);
  const [username, setUsername] = useState<string>('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [multiplayerMessage, setMultiplayerMessage] = useState<string>('');

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
    isRegistered: multiplayerRegistered,
    connectionStatus: multiplayerStatus,
  } = useMultiplayerConnection({
    serverUrl: 'ws://localhost:8080/ws',
    username: username && username.trim() ? username : '', // Only pass username if it's valid
    onConnected: () => {
      console.log('Multiplayer connected');
    },
    onRegistered: (data) => {
      console.log('Multiplayer registered:', data);
      setMultiplayerMessage(data.message);
      setTimeout(() => setMultiplayerMessage(''), 3000);
    },
    onError: (error) => {
      console.error('Multiplayer error:', error);
      setMultiplayerMessage(`Error: ${error}`);
      setTimeout(() => setMultiplayerMessage(''), 3000);
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

  // Check for existing username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('stickrunner-username');
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      setShowUsernameModal(true);
    }
  }, []);

  // Handle username submission
  const handleUsernameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (usernameInput.trim()) {
      const cleanUsername = usernameInput.trim();
      setUsername(cleanUsername);
      localStorage.setItem('stickrunner-username', cleanUsername);
      setShowUsernameModal(false);
      setEditingUsername(false);
      setUsernameInput('');
    }
  };

  // Handle username edit
  const startEditingUsername = () => {
    setUsernameInput(username);
    setEditingUsername(true);
  };

  const cancelEditingUsername = () => {
    setUsernameInput('');
    setEditingUsername(false);
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

    // Create starfield background
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: CONFIG.COLORS.STARS,
      size: CONFIG.STAR_SIZE,
    });

    const starsVertices = [];
    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
      const x = CONFIG.RNG.starPosition();
      const y = CONFIG.RNG.starPosition();
      const z = CONFIG.RNG.starPosition();
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    renderer.setClearColor(CONFIG.COLORS.BACKGROUND);

    // Create road with shadow receiving
    const roadGeometry = new THREE.PlaneGeometry(
      CONFIG.ROAD_WIDTH,
      CONFIG.ROAD_LENGTH
    );
    const roadMaterial = new THREE.MeshLambertMaterial({
      color: CONFIG.COLORS.ROAD,
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    road.position.y = CONFIG.ROAD_POSITION_Y;
    road.position.z = CONFIG.ROAD_POSITION_Z; // Center the road extending forward
    road.receiveShadow = true;
    scene.add(road);

    // Create road lines
    const lineGeometry = new THREE.PlaneGeometry(
      CONFIG.ROAD_LINE_WIDTH,
      CONFIG.ROAD_LENGTH
    );
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.ROAD_LINES,
    });

    // Center line
    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = -1.98;
    centerLine.position.z = -500;
    scene.add(centerLine);

    // Side lines
    const leftLine = new THREE.Mesh(lineGeometry, lineMaterial);
    leftLine.rotation.x = -Math.PI / 2;
    leftLine.position.y = -1.98;
    leftLine.position.x = -2.8;
    leftLine.position.z = -500;
    scene.add(leftLine);

    const rightLine = new THREE.Mesh(lineGeometry, lineMaterial);
    rightLine.rotation.x = -Math.PI / 2;
    rightLine.position.y = -1.98;
    rightLine.position.x = 2.8;
    rightLine.position.z = -500;
    scene.add(rightLine);

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
    const gates: THREE.Group[] = [];
    let nextGateZ = CONFIG.INITIAL_GATE_Z;
    const gateSpacing = CONFIG.GATE_SPACING;

    // Mob system with velocity tracking
    const cubes: THREE.Mesh[] = [cube]; // Start with the main cube (collision box)
    const stickPeople: StickPerson[] = [firstStickPerson]; // Visual stick people
    const cubeVelocities: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)]; // Velocity for each cube
    let currentMobCount = 1;

    // Zombie system
    const zombies: Zombie[] = [];

    // Bullet system
    const bullets: Bullet[] = [];

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
      // Randomly assign which side gets positive/negative
      const leftIsPositive = CONFIG.RNG.isLeftGatePositive();

      // Create left gate
      const leftGate = new THREE.Group();
      const leftColor = leftIsPositive
        ? CONFIG.COLORS.POSITIVE_GATE
        : CONFIG.COLORS.NEGATIVE_GATE;

      const leftPostGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
      const leftPostMaterial = new THREE.MeshBasicMaterial({
        color: leftColor,
      });

      const leftInnerPost = new THREE.Mesh(leftPostGeometry, leftPostMaterial);
      leftInnerPost.position.set(-0.2, 0.5, 0); // Move left post to the left side
      leftGate.add(leftInnerPost);

      const leftOuterPost = new THREE.Mesh(leftPostGeometry, leftPostMaterial);
      leftOuterPost.position.set(-3, 0.5, 0);
      leftGate.add(leftOuterPost);

      // Add force field for left gate
      const leftForceFieldGeometry = new THREE.PlaneGeometry(3, 3);
      const leftForceFieldMaterial = new THREE.MeshBasicMaterial({
        color: leftColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const leftForceField = new THREE.Mesh(
        leftForceFieldGeometry,
        leftForceFieldMaterial
      );
      leftForceField.position.set(-1.5, 0.5, 0);
      leftGate.add(leftForceField);

      leftGate.position.set(0, -2, zPosition);
      (leftGate as any).isPositive = leftIsPositive;
      (leftGate as any).hasTriggered = false;
      (leftGate as any).side = "left";
      (leftGate as any).pairId = zPosition;

      // Create right gate
      const rightGate = new THREE.Group();
      const rightColor = !leftIsPositive
        ? CONFIG.COLORS.POSITIVE_GATE
        : CONFIG.COLORS.NEGATIVE_GATE;

      const rightPostGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
      const rightPostMaterial = new THREE.MeshBasicMaterial({
        color: rightColor,
      });

      const rightInnerPost = new THREE.Mesh(
        rightPostGeometry,
        rightPostMaterial
      );
      rightInnerPost.position.set(0.2, 0.5, 0); // Move right post to the right side
      rightGate.add(rightInnerPost);

      const rightOuterPost = new THREE.Mesh(
        rightPostGeometry,
        rightPostMaterial
      );
      rightOuterPost.position.set(3, 0.5, 0);
      rightGate.add(rightOuterPost);

      // Add force field for right gate
      const rightForceFieldGeometry = new THREE.PlaneGeometry(3, 3);
      const rightForceFieldMaterial = new THREE.MeshBasicMaterial({
        color: rightColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const rightForceField = new THREE.Mesh(
        rightForceFieldGeometry,
        rightForceFieldMaterial
      );
      rightForceField.position.set(1.5, 0.5, 0);
      rightGate.add(rightForceField);

      rightGate.position.set(0, -2, zPosition);
      (rightGate as any).isPositive = !leftIsPositive;
      (rightGate as any).hasTriggered = false;
      (rightGate as any).side = "right";
      (rightGate as any).pairId = zPosition;

      scene.add(leftGate);
      scene.add(rightGate);
      gates.push(leftGate);
      gates.push(rightGate);
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
    const animate = () => {
      if (!gameRunning) return; // Stop animation if game over

      // Check if game should be paused based on Claude status (use ref for current value)
      // Allow force start to override pause for idle/waiting-permission states
      gamePaused =
        !forceStartedRef.current &&
        (claudeStatusRef.current?.state === "idle" ||
          claudeStatusRef.current?.state === "waiting-permission");

      if (gamePaused) {
        // If paused, keep checking for unpause
        setTimeout(() => animate(), 100);
        return;
      }

      animationId = requestAnimationFrame(animate);

      // Move camera forward along the road
      camera.position.z -= CONFIG.CAMERA_SPEED;
      camera.lookAt(
        0,
        0,
        camera.position.z - CONFIG.CAMERA_LOOK_AHEAD_DISTANCE
      );

      // Update magnetic point position
      magnetPoint.z -= CONFIG.CAMERA_SPEED; // Move forward with camera

      // Smooth magnetic point movement based on mouse input
      const deltaX = targetX - magnetPoint.x;
      const moveStep = Math.sign(deltaX) * Math.min(Math.abs(deltaX), maxSpeed);
      magnetPoint.x += moveStep;

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

      // Spawn zombies randomly ahead of the camera
      if (CONFIG.RNG.shouldSpawnZombie()) {
        const newZombie = new Zombie();
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
        const gateAny = gate as any;

        // Check each challenger individually for gate collision
        for (let cubeIndex = cubes.length - 1; cubeIndex >= 0; cubeIndex--) {
          const testCube = cubes[cubeIndex];
          const cubeId = `${gateAny.pairId}_${cubeIndex}`;

          // Check if this specific cube has already triggered this gate
          if (!triggeredPairs.has(cubeId)) {
            let inGateRange = false;

            if (gateAny.side === "left") {
              // Left gate spans from x = -3 to x = 0
              inGateRange =
                testCube.position.x >= -3 && testCube.position.x <= 0;
            } else if (gateAny.side === "right") {
              // Right gate spans from x = 0 to x = 3
              inGateRange =
                testCube.position.x >= 0 && testCube.position.x <= 3;
            }

            // Check if cube is passing through the gate
            if (
              inGateRange &&
              Math.abs(gate.position.z - testCube.position.z) < 1
            ) {
              // Mark this cube as having triggered this gate
              triggeredPairs.add(cubeId);

              if (gateAny.isPositive) {
                // Blue gate: 30% chance to duplicate this cube
                if (CONFIG.RNG.shouldDuplicate()) {
                  currentMobCount++;

                  // Create new collision box (invisible)
                  const newCube = new THREE.Mesh(geometry, material.clone());
                  newCube.visible = false;
                  newCube.position.set(
                    testCube.position.x + CONFIG.RNG.cubeSpawnOffsetX(),
                    testCube.position.y,
                    testCube.position.z + CONFIG.RNG.cubeSpawnOffsetZ()
                  );
                  scene.add(newCube);
                  cubes.push(newCube);
                  cubeVelocities.push(new THREE.Vector3(0, 0, 0));

                  // Create new stick person (visible)
                  const newStickPerson = new StickPerson();
                  newStickPerson.setPosition(
                    newCube.position.x,
                    newCube.position.y,
                    newCube.position.z
                  );
                  scene.add(newStickPerson.group);
                  stickPeople.push(newStickPerson);

                  setMobCount(currentMobCount);
                }
              } else {
                // Red gate: delete this cube and stick person
                currentMobCount--;
                scene.remove(testCube);
                testCube.geometry.dispose();
                (testCube.material as THREE.Material).dispose();

                // Remove corresponding stick person
                const stickPerson = stickPeople[cubeIndex];
                if (stickPerson) {
                  scene.remove(stickPerson.group);
                  stickPerson.dispose();
                  stickPeople.splice(cubeIndex, 1);
                }

                cubes.splice(cubeIndex, 1);
                cubeVelocities.splice(cubeIndex, 1);
                setMobCount(currentMobCount);

                // Check for game over
                if (cubes.length === 0) {
                  gameRunning = false;
                  setGameOver(true);
                }
              }
            }
          }
        }

        // Remove gates that are far behind and clean up triggered pairs
        if (gate.position.z > camera.position.z + 20) {
          // Clean up all triggered pairs for this gate
          const keysToDelete = Array.from(triggeredPairs).filter((key) =>
            key.toString().startsWith(gateAny.pairId.toString())
          );
          keysToDelete.forEach((key) => triggeredPairs.delete(key));

          scene.remove(gate);
          gates.splice(i, 1);
        }
      }

      // Update zombies - move toward camera and check collisions
      for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];

        // Animate zombie
        zombie.animate(0.016);

        // Move zombie toward camera (but slower than camera speed)
        zombie.group.position.z += CONFIG.ZOMBIE_SPEED;

        // Check bullet collisions with this zombie
        let zombieHit = false;
        for (let k = bullets.length - 1; k >= 0; k--) {
          const bullet = bullets[k];
          const bulletDistance = bullet
            .getPosition()
            .distanceTo(zombie.getPosition());

          if (bulletDistance < CONFIG.BULLET_DAMAGE_DISTANCE) {
            // Bullet hit zombie - remove both
            console.log(`Zombie hit! Distance: ${bulletDistance.toFixed(2)}`);
            scene.remove(bullet.mesh);
            bullet.dispose();
            bullets.splice(k, 1);

            scene.remove(zombie.group);
            zombie.dispose();
            zombies.splice(i, 1);
            zombieHit = true;
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

            // Remove stick person
            scene.remove(stickPerson.group);
            stickPerson.dispose();
            stickPeople.splice(j, 1);

            // Remove corresponding cube
            const correspondingCube = cubes[j];
            if (correspondingCube) {
              scene.remove(correspondingCube);
              correspondingCube.geometry.dispose();
              (correspondingCube.material as THREE.Material).dispose();
              cubes.splice(j, 1);
              cubeVelocities.splice(j, 1);
            }

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

            // Remove stick person
            scene.remove(stickPerson.group);
            stickPerson.dispose();
            stickPeople.splice(j, 1);

            // Remove corresponding cube
            const correspondingCube = cubes[j];
            if (correspondingCube) {
              scene.remove(correspondingCube);
              correspondingCube.geometry.dispose();
              (correspondingCube.material as THREE.Material).dispose();
              cubes.splice(j, 1);
              cubeVelocities.splice(j, 1);
            }

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
        const stillActive = bullet.update();

        if (!stillActive) {
          // Remove bullet that has traveled too far
          scene.remove(bullet.mesh);
          bullet.dispose();
          bullets.splice(i, 1);
        }
      }

      // Update ALL cubes with proper velocity-based physics
      for (let index = cubes.length - 1; index >= 0; index--) {
        const mobCube = cubes[index];
        // Update corresponding stick person animation
        const stickPerson = stickPeople[index];
        if (stickPerson) {
          stickPerson.animate(0.016); // Assuming ~60fps

          // Handle shooting
          if (stickPerson.canShoot()) {
            const bulletPosition = stickPerson.shoot();
            if (bulletPosition) {
              const newBullet = new Bullet(bulletPosition);
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

            // Remove stick person
            scene.remove(stickPerson.group);
            stickPerson.dispose();
            stickPeople.splice(index, 1);

            // Remove corresponding cube
            scene.remove(mobCube);
            mobCube.geometry.dispose();
            (mobCube.material as THREE.Material).dispose();
            cubes.splice(index, 1);
            cubeVelocities.splice(index, 1);

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
        mobCube.position.z -= CONFIG.CAMERA_SPEED;

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

        // Apply forces to velocity (not position)
        velocity.x += forceX;
        velocity.z += forceZ;

        // Apply damping to prevent oscillations
        const damping = CONFIG.VELOCITY_DAMPING;
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

        // Apply velocity to position
        mobCube.position.x += velocity.x;
        mobCube.position.z += velocity.z;

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
        scene.remove(gate);
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
              className="text-sm px-2 py-1 rounded text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
              maxLength={20}
              autoFocus
              onKeyDown={(e) => e.key === 'Escape' && cancelEditingUsername()}
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
              {multiplayerStatus === 'registered' ? 'Online' : 
               multiplayerStatus === 'connected' ? 'Connecting...' :
               multiplayerStatus === 'connecting' ? 'Connecting...' :
               'Offline'}
            </span>
          </div>
          {multiplayerMessage && (
            <div className="text-xs text-gray-300 mt-1 max-w-48 truncate">
              {multiplayerMessage}
            </div>
          )}
        </div>
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
                    Game Paused
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Claude is idle - ask Claude something to resume!
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
              <button
                onClick={() => setForceStarted(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Force Start Game
              </button>
            </div>
          </div>
        )}

      {/* Username Modal */}
      {showUsernameModal && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Stick Runner!</h2>
            <p className="text-gray-600 mb-6">Choose a username to get started:</p>
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

      {gameOver && (
        <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-4xl font-bold text-red-600 mb-4">Game Over!</h2>
            <p className="text-xl text-gray-700 mb-6">
              All your challengers were eliminated!
            </p>
            <button
              onClick={() => (window as any).restartGame?.()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Restart Game
            </button>
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
    </div>
  );
});

export default App;

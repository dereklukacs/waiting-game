import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const App = observer(() => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mobCount, setMobCount] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Clear any existing content
    mountRef.current.innerHTML = '';

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Create starfield background
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
    
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    renderer.setClearColor(0x000428);

    // Create road
    const roadGeometry = new THREE.PlaneGeometry(6, 2000);
    const roadMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x333333 
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    road.position.y = -2;
    road.position.z = -500; // Center the road extending forward
    scene.add(road);

    // Create road lines
    const lineGeometry = new THREE.PlaneGeometry(0.2, 2000);
    const lineMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff 
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

    // Create a cube (player)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      wireframe: false 
    });
    const cube = new THREE.Mesh(geometry, material);
    
    // Add edges to the cube
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframe = new THREE.LineSegments(edges, edgeMaterial);
    cube.add(wireframe);
    
    cube.position.y = -1;
    scene.add(cube);

    // Dynamic gate generation
    const gates: THREE.Group[] = [];
    let nextGateZ = -20; // Start spawning gates ahead
    const gateSpacing = 15;
    
    // Mob system with velocity tracking
    const cubes: THREE.Mesh[] = [cube]; // Start with the main cube
    const cubeVelocities: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)]; // Velocity for each cube
    let currentMobCount = 1;
    
    // Gate pair tracking
    const triggeredPairs = new Set<number>();
    
    // Magnetic point controls (invisible point that all cubes are attracted to)
    const magnetPoint = new THREE.Vector3(0, -1, 0); // Starting position
    let targetX = 0;
    const maxSpeed = 0.15;
    const roadBounds = 2.5; // Half road width minus cube size
    let isDragging = false;
    let lastMouseX = 0;
    
    const createGatePair = (zPosition: number) => {
      // Randomly assign which side gets positive/negative
      const leftIsPositive = Math.random() > 0.5;
      
      // Create left gate
      const leftGate = new THREE.Group();
      const leftColor = leftIsPositive ? 0x4444ff : 0xff4444;
      
      const leftPostGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
      const leftPostMaterial = new THREE.MeshBasicMaterial({ color: leftColor });
      
      const leftInnerPost = new THREE.Mesh(leftPostGeometry, leftPostMaterial);
      leftInnerPost.position.set(0, 0.5, 0);
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
        side: THREE.DoubleSide
      });
      const leftForceField = new THREE.Mesh(leftForceFieldGeometry, leftForceFieldMaterial);
      leftForceField.position.set(-1.5, 0.5, 0);
      leftGate.add(leftForceField);
      
      leftGate.position.set(0, -2, zPosition);
      (leftGate as any).isPositive = leftIsPositive;
      (leftGate as any).hasTriggered = false;
      (leftGate as any).side = 'left';
      (leftGate as any).pairId = zPosition;
      
      // Create right gate
      const rightGate = new THREE.Group();
      const rightColor = !leftIsPositive ? 0x4444ff : 0xff4444;
      
      const rightPostGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
      const rightPostMaterial = new THREE.MeshBasicMaterial({ color: rightColor });
      
      const rightInnerPost = new THREE.Mesh(rightPostGeometry, rightPostMaterial);
      rightInnerPost.position.set(0, 0.5, 0);
      rightGate.add(rightInnerPost);
      
      const rightOuterPost = new THREE.Mesh(rightPostGeometry, rightPostMaterial);
      rightOuterPost.position.set(3, 0.5, 0);
      rightGate.add(rightOuterPost);
      
      // Add force field for right gate
      const rightForceFieldGeometry = new THREE.PlaneGeometry(3, 3);
      const rightForceFieldMaterial = new THREE.MeshBasicMaterial({ 
        color: rightColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const rightForceField = new THREE.Mesh(rightForceFieldGeometry, rightForceFieldMaterial);
      rightForceField.position.set(1.5, 0.5, 0);
      rightGate.add(rightForceField);
      
      rightGate.position.set(0, -2, zPosition);
      (rightGate as any).isPositive = !leftIsPositive;
      (rightGate as any).hasTriggered = false;
      (rightGate as any).side = 'right';
      (rightGate as any).pairId = zPosition;
      
      scene.add(leftGate);
      scene.add(rightGate);
      gates.push(leftGate);
      gates.push(rightGate);
    };
    
    // Create initial gate pairs
    for (let i = 0; i < 8; i++) {
      createGatePair(nextGateZ - (i * gateSpacing));
    }
    
    // Set nextGateZ beyond the initial gates to prevent overlap
    nextGateZ = nextGateZ - (8 * gateSpacing) - gateSpacing;

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

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation loop
    let animationId: number;
    let gameRunning = true;
    const animate = () => {
      if (!gameRunning) return; // Stop animation if game over
      animationId = requestAnimationFrame(animate);
      
      // Move camera forward along the road
      camera.position.z -= 0.1;
      camera.lookAt(0, 0, camera.position.z - 18);
      
      // Update magnetic point position
      magnetPoint.z -= 0.1; // Move forward with camera
      
      // Smooth magnetic point movement based on mouse input
      const deltaX = targetX - magnetPoint.x;
      const moveStep = Math.sign(deltaX) * Math.min(Math.abs(deltaX), maxSpeed);
      magnetPoint.x += moveStep;
      
      // Generate new gate pairs ahead
      if (camera.position.z < nextGateZ + 50) {
        createGatePair(nextGateZ);
        nextGateZ -= gateSpacing;
      }
      
      // Check gate collisions with individual cubes
      for (let i = gates.length - 1; i >= 0; i--) {
        const gate = gates[i];
        const gateAny = gate as any;
        
        // Check each cube individually for gate collision
        for (let cubeIndex = cubes.length - 1; cubeIndex >= 0; cubeIndex--) {
          const testCube = cubes[cubeIndex];
          const cubeId = `${gateAny.pairId}_${cubeIndex}`;
          
          // Check if this specific cube has already triggered this gate
          if (!triggeredPairs.has(cubeId)) {
            let inGateRange = false;
            
            if (gateAny.side === 'left') {
              // Left gate spans from x = -3 to x = 0
              inGateRange = testCube.position.x >= -3 && testCube.position.x <= 0;
            } else if (gateAny.side === 'right') {
              // Right gate spans from x = 0 to x = 3
              inGateRange = testCube.position.x >= 0 && testCube.position.x <= 3;
            }
            
            // Check if cube is passing through the gate
            if (inGateRange && Math.abs(gate.position.z - testCube.position.z) < 1) {
              // Mark this cube as having triggered this gate
              triggeredPairs.add(cubeId);
              
              if (gateAny.isPositive) {
                // Blue gate: 30% chance to duplicate this cube
                if (Math.random() < 0.3) {
                  currentMobCount++;
                  const newCube = new THREE.Mesh(geometry, material.clone());
                  
                  // Add edges to the new cube
                  const newEdges = new THREE.EdgesGeometry(geometry);
                  const newLineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
                  const newWireframe = new THREE.LineSegments(newEdges, newLineMaterial);
                  newCube.add(newWireframe);
                  
                  // Spawn near the triggering cube
                  newCube.position.set(
                    testCube.position.x + (Math.random() - 0.5) * 1.5,
                    testCube.position.y,
                    testCube.position.z + (Math.random() - 0.5) * 1.5
                  );
                  scene.add(newCube);
                  cubes.push(newCube);
                  cubeVelocities.push(new THREE.Vector3(0, 0, 0));
                  setMobCount(currentMobCount);
                }
              } else {
                // Red gate: delete this cube
                currentMobCount--;
                scene.remove(testCube);
                testCube.geometry.dispose();
                (testCube.material as THREE.Material).dispose();
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
          const keysToDelete = Array.from(triggeredPairs).filter(key => 
            key.toString().startsWith(gateAny.pairId.toString())
          );
          keysToDelete.forEach(key => triggeredPairs.delete(key));
          
          scene.remove(gate);
          gates.splice(i, 1);
        }
      }
      
      // Update ALL cubes with proper velocity-based physics
      cubes.forEach((mobCube, index) => {
        // All cubes spin the same way
        mobCube.rotation.y += 0.02;
        mobCube.rotation.x += 0.01;
        
        // Move forward with camera
        mobCube.position.z -= 0.1;
        
        // Get this cube's velocity
        const velocity = cubeVelocities[index];
        
        // Calculate forces (much gentler)
        let forceX = 0;
        let forceZ = 0;
        
        // Attraction to magnetic point (very gentle)
        const attractionStrength = 0.008;
        const dx = magnetPoint.x - mobCube.position.x;
        const dz = magnetPoint.z - mobCube.position.z;
        const distanceToMagnet = Math.sqrt(dx * dx + dz * dz);
        
        if (distanceToMagnet > 0.5) { // Only attract if far from magnet
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
            const minDistance = 0.8;
            if (distance < minDistance && distance > 0.1) {
              const hardRepulsion = 0.15;
              const repulsionForce = hardRepulsion * (minDistance - distance) / minDistance;
              forceX += (deltaX / distance) * repulsionForce;
              forceZ += (deltaZ / distance) * repulsionForce;
            }
            
            // Soft spacing (comfortable distance)
            const comfortDistance = 1.4;
            if (distance < comfortDistance && distance > minDistance) {
              const softRepulsion = 0.02;
              const repulsionForce = softRepulsion * (comfortDistance - distance) / comfortDistance;
              forceX += (deltaX / distance) * repulsionForce;
              forceZ += (deltaZ / distance) * repulsionForce;
            }
          }
        });
        
        // Apply forces to velocity (not position)
        velocity.x += forceX;
        velocity.z += forceZ;
        
        // Apply damping to prevent oscillations
        const damping = 0.85;
        velocity.x *= damping;
        velocity.z *= damping;
        
        // Limit velocity to prevent crazy speeds
        const maxSpeed = 0.1;
        const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        if (currentSpeed > maxSpeed) {
          velocity.x = (velocity.x / currentSpeed) * maxSpeed;
          velocity.z = (velocity.z / currentSpeed) * maxSpeed;
        }
        
        // Apply velocity to position
        mobCube.position.x += velocity.x;
        mobCube.position.z += velocity.z;
        
        // Final collision correction - push apart any overlapping cubes
        cubes.forEach((otherCube, otherIndex) => {
          if (otherCube !== mobCube && otherIndex !== index) {
            const deltaX = mobCube.position.x - otherCube.position.x;
            const deltaZ = mobCube.position.z - otherCube.position.z;
            const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
            const minSeparation = 0.6; // Minimum allowed distance
            
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
        mobCube.position.y = -1;
      });
      
      renderer.render(scene, camera);
    };

    animate();
    
    // Restart function
    const restartGame = () => {
      setGameOver(false);
      setMobCount(1);
      gameRunning = true;
      
      // Clear all existing gates
      gates.forEach(gate => {
        scene.remove(gate);
      });
      gates.length = 0;
      
      // Clear all cubes
      while (cubes.length > 0) {
        const removedCube = cubes.pop();
        cubeVelocities.pop();
        if (removedCube) {
          scene.remove(removedCube);
          removedCube.geometry.dispose();
          (removedCube.material as THREE.Material).dispose();
        }
      }
      
      // Recreate the first cube
      const newCube = new THREE.Mesh(geometry, material);
      
      // Add edges to the cube
      const edges = new THREE.EdgesGeometry(geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
      const wireframe = new THREE.LineSegments(edges, edgeMaterial);
      newCube.add(wireframe);
      
      newCube.position.set(0, -1, 0);
      scene.add(newCube);
      cubes.push(newCube);
      cubeVelocities.push(new THREE.Vector3(0, 0, 0));
      
      // Reset camera and magnetic point to starting positions
      camera.position.set(0, 3, 8);
      camera.lookAt(0, 0, -10);
      magnetPoint.set(0, -1, 0);
      targetX = 0;
      currentMobCount = 1;
      
      // Reset gate generation system
      nextGateZ = -20;
      
      // Create new initial gate pairs
      for (let i = 0; i < 8; i++) {
        createGatePair(nextGateZ - (i * gateSpacing));
      }
      
      // Set nextGateZ beyond the initial gates to prevent overlap
      nextGateZ = nextGateZ - (8 * gateSpacing) - gateSpacing;
      
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

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
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
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-xl font-bold">
        Cubes: {mobCount}
      </div>
      
      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 text-center">
            <h2 className="text-4xl font-bold text-red-600 mb-4">Game Over!</h2>
            <p className="text-xl text-gray-700 mb-6">All your cubes were eliminated!</p>
            <button
              onClick={() => (window as any).restartGame?.()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Restart Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default App;

import * as THREE from 'three';
import { CONFIG } from './config';

export class Obstacle {
  public mesh: THREE.Mesh;
  private disposed: boolean = false;

  constructor(x: number, z: number) {
    // Create obstacle geometry
    const geometry = new THREE.BoxGeometry(
      CONFIG.OBSTACLE_WIDTH,
      CONFIG.OBSTACLE_HEIGHT,
      CONFIG.OBSTACLE_DEPTH
    );
    
    // Create obstacle material
    const material = new THREE.MeshLambertMaterial({ 
      color: CONFIG.COLORS.OBSTACLE 
    });
    
    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    
    // Position obstacle
    this.mesh.position.set(x, CONFIG.ROAD_POSITION_Y + CONFIG.OBSTACLE_HEIGHT / 2, z);
    
    // Enable shadows
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  public checkCollision(stickPersonPosition: THREE.Vector3): boolean {
    if (this.disposed) return false;

    // Check horizontal distance first
    const dx = Math.abs(stickPersonPosition.x - this.mesh.position.x);
    const dz = Math.abs(stickPersonPosition.z - this.mesh.position.z);

    // Check if within horizontal collision bounds
    const horizontalCollision = dx < CONFIG.OBSTACLE_WIDTH / 2 && dz < CONFIG.OBSTACLE_DEPTH / 2;
    
    if (!horizontalCollision) return false;

    // Check if stick person is at collision height (not jumping high enough)
    // Stick person ground Y is -1.2, obstacle collision height threshold should be relative to that
    const jumpClearanceHeight = CONFIG.STICK_PERSON_GROUND_Y + CONFIG.OBSTACLE_COLLISION_HEIGHT;
    if (stickPersonPosition.y > jumpClearanceHeight) {
      return false; // Stick person is jumping over the obstacle
    }

    return true;
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  public shouldCleanup(cameraZ: number): boolean {
    return this.mesh.position.z > cameraZ + CONFIG.OBSTACLE_CLEANUP_DISTANCE;
  }

  public dispose() {
    if (this.disposed) return;
    
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
    this.disposed = true;
  }
}
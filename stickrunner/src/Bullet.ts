import * as THREE from 'three';
import { CONFIG } from './config';

export class Bullet {
  public mesh: THREE.Mesh;
  private startZ: number;

  constructor(startPosition: THREE.Vector3) {
    // Create bullet geometry and material
    const geometry = new THREE.SphereGeometry(CONFIG.BULLET_SIZE, 8, 6);
    const material = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.BULLET });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(startPosition);
    this.startZ = startPosition.z;
  }

  public update(): boolean {
    // Move bullet forward
    this.mesh.position.z -= CONFIG.BULLET_SPEED;
    
    // Check if bullet has traveled too far
    const distanceTraveled = Math.abs(this.mesh.position.z - this.startZ);
    return distanceTraveled < CONFIG.BULLET_RANGE;
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  public dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
import * as THREE from 'three';
import { CONFIG } from './config';

export class Coin {
  public mesh: THREE.Mesh;
  private animationTime: number = 0;
  private collected: boolean = false;
  
  constructor(position: THREE.Vector3) {
    // Create coin geometry - a cylinder that looks like a coin
    const geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 12);
    const material = new THREE.MeshLambertMaterial({ 
      color: CONFIG.COLORS.COIN,
      emissive: CONFIG.COLORS.COIN_EMISSIVE
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.castShadow = true;
    
    // Rotate coin to be flat (lying on the ground)
    this.mesh.rotation.x = Math.PI / 2;
  }
  
  public animate(deltaTime: number): void {
    if (this.collected) return;
    
    this.animationTime += deltaTime * 4; // Rotation speed
    
    // Rotate coin around Y axis for spinning effect
    this.mesh.rotation.y = this.animationTime;
    
    // Add slight bobbing motion
    this.mesh.position.y = this.mesh.position.y + Math.sin(this.animationTime * 2) * 0.01;
  }
  
  public checkCollision(playerPosition: THREE.Vector3): boolean {
    if (this.collected) return false;
    
    const distance = this.mesh.position.distanceTo(playerPosition);
    return distance < CONFIG.COIN_COLLECTION_DISTANCE;
  }
  
  public collect(): void {
    this.collected = true;
  }
  
  public isCollected(): boolean {
    return this.collected;
  }
  
  public shouldCleanup(cameraZ: number): boolean {
    return this.mesh.position.z > cameraZ + CONFIG.COIN_CLEANUP_DISTANCE;
  }
  
  public dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
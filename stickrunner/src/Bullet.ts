import * as THREE from "three";
import { CONFIG } from "./config";
import { type WeaponStats } from "./WeaponUpgrade";

export class Bullet {
  public mesh: THREE.Mesh;
  private startZ: number;
  public damage: number;
  private velocity: number;

  constructor(startPosition: THREE.Vector3, weaponStats: WeaponStats) {
    // Create bullet geometry and material
    const geometry = new THREE.SphereGeometry(CONFIG.BULLET_SIZE, 8, 6);
    const material = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.BULLET,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(startPosition);
    this.startZ = startPosition.z;
    this.damage = weaponStats.damage;
    this.velocity = weaponStats.bulletVelocity;
  }

  public update(
    deltaTime: number = 1 / 60,
    speedMultiplier: number = 1
  ): boolean {
    // Move bullet forward (delta time based with speed multiplier and weapon velocity)
    const bulletSpeed = this.velocity * 60 * deltaTime * speedMultiplier;
    this.mesh.position.z -= bulletSpeed;

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

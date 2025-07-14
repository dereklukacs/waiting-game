import * as THREE from 'three';
import { CONFIG } from './config';

export class Zombie {
  public group: THREE.Group;
  public leftLeg: THREE.Mesh;
  public rightLeg: THREE.Mesh;
  public leftArm: THREE.Mesh;
  public rightArm: THREE.Mesh;
  private animationTime: number = 0;

  constructor() {
    this.group = new THREE.Group();
    
    // Materials (dark red zombie color)
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.ZOMBIE });
    const limbMaterial = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.ZOMBIE });
    
    // Head (sphere) - slightly larger and more menacing
    const headGeometry = new THREE.SphereGeometry(0.18, 8, 6);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.6, 0);
    this.group.add(head);
    
    // Body (cylinder) - slightly bulkier
    const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 8);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.05, 0);
    this.group.add(body);
    
    // Arms - slightly longer and more menacing
    const armGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.45, 6);
    
    this.leftArm = new THREE.Mesh(armGeometry, limbMaterial);
    this.leftArm.position.set(-0.17, 0.2, 0);
    this.group.add(this.leftArm);
    
    this.rightArm = new THREE.Mesh(armGeometry, limbMaterial);
    this.rightArm.position.set(0.17, 0.2, 0);
    this.group.add(this.rightArm);
    
    // Legs - slightly thicker
    const legGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.55, 6);
    
    this.leftLeg = new THREE.Mesh(legGeometry, limbMaterial);
    this.leftLeg.position.set(-0.09, -0.5, 0);
    this.group.add(this.leftLeg);
    
    this.rightLeg = new THREE.Mesh(legGeometry, limbMaterial);
    this.rightLeg.position.set(0.09, -0.5, 0);
    this.group.add(this.rightLeg);
    
    // Set initial position
    this.group.position.y = -0.25; // Adjust so feet are on ground
  }
  
  public animate(deltaTime: number) {
    this.animationTime += deltaTime * 6; // Slower, more menacing walk
    
    // Zombie shambling animation - less coordinated than running
    const legSwing = Math.sin(this.animationTime) * 0.2; // Smaller leg swing
    const armSwing = Math.sin(this.animationTime + Math.PI * 0.3) * 0.3; // More erratic arm movement
    
    // Leg animation (shambling walk)
    this.leftLeg.rotation.x = legSwing;
    this.rightLeg.rotation.x = -legSwing * 0.8; // Slightly asymmetric
    
    // Arm animation (reaching/grasping motion)
    this.leftArm.rotation.x = armSwing;
    this.rightArm.rotation.x = -armSwing * 1.2; // More aggressive right arm
    
    // Slight side-to-side sway
    const sway = Math.sin(this.animationTime * 0.7) * 0.02;
    this.group.rotation.z = sway;
    
    // Slight bob up and down (less smooth than stick people)
    const bobHeight = Math.abs(Math.sin(this.animationTime * 1.5)) * 0.03;
    this.group.position.y = -0.25 + bobHeight;
  }
  
  public setPosition(x: number, y: number, z: number) {
    this.group.position.x = x;
    this.group.position.z = z;
    // Y is handled by animation
  }
  
  public getPosition(): THREE.Vector3 {
    return this.group.position.clone();
  }
  
  public dispose() {
    // Clean up geometries and materials
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }
}
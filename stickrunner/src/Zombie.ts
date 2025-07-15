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
    
    // Zombie color variations for more menacing look
    const zombieBaseColor = new THREE.Color(CONFIG.COLORS.ZOMBIE);
    const variation = Math.random();
    const zombieColor = zombieBaseColor.clone().multiplyScalar(0.7 + variation * 0.3);
    
    // Better materials with lighting response
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: zombieColor,
      transparent: false
    });
    const limbMaterial = new THREE.MeshLambertMaterial({ 
      color: zombieColor.clone().multiplyScalar(0.8) // Darker limbs
    });
    
    // Head (sphere) - slightly larger and more menacing with better detail
    const headGeometry = new THREE.SphereGeometry(0.18, 12, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.6, 0);
    head.castShadow = true;
    this.group.add(head);
    
    // Body (cylinder) - slightly bulkier with more detail
    const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 12);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.05, 0);
    body.castShadow = true;
    this.group.add(body);
    
    // Arms - slightly longer and more menacing with better geometry
    const armGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.45, 8);
    
    this.leftArm = new THREE.Mesh(armGeometry, limbMaterial);
    this.leftArm.position.set(-0.17, 0.2, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);
    
    this.rightArm = new THREE.Mesh(armGeometry, limbMaterial);
    this.rightArm.position.set(0.17, 0.2, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);
    
    // Legs - slightly thicker with better detail
    const legGeometry = new THREE.CylinderGeometry(0.04, 0.05, 0.55, 8);
    
    this.leftLeg = new THREE.Mesh(legGeometry, limbMaterial);
    this.leftLeg.position.set(-0.09, -0.5, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);
    
    this.rightLeg = new THREE.Mesh(legGeometry, limbMaterial);
    this.rightLeg.position.set(0.09, -0.5, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);
    
    // Add menacing clawed feet
    const footGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.1);
    const footMaterial = new THREE.MeshLambertMaterial({ color: zombieColor.clone().multiplyScalar(0.6) });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(-0.09, -0.75, 0.03);
    leftFoot.castShadow = true;
    this.group.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(0.09, -0.75, 0.03);
    rightFoot.castShadow = true;
    this.group.add(rightFoot);
    
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
    this.group.position.y = -1.0 + bobHeight;
  }
  
  public setPosition(x: number, _y: number, z: number) {
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
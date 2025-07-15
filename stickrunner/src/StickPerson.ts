import * as THREE from 'three';
import { CONFIG } from './config';

export class StickPerson {
  public group: THREE.Group;
  public leftLeg: THREE.Mesh;
  public rightLeg: THREE.Mesh;
  public leftArm: THREE.Mesh;
  public rightArm: THREE.Mesh;
  private animationTime: number = 0;
  private variation: number;
  public isFalling: boolean = false;
  private fallVelocity: number = 0;
  private fallRotationVelocity: number = 0;
  private shootCooldown: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.variation = Math.random(); // For color/size variation
    
    // Create varied colors for better differentiation
    const hue = (this.variation * 0.3 + 0.3); // Green to blue-green range
    const saturation = 0.6 + this.variation * 0.4;
    const lightness = 0.4 + this.variation * 0.3;
    const personColor = new THREE.Color().setHSL(hue, saturation, lightness);
    
    // Slightly varied size for individuality
    const sizeScale = 0.9 + this.variation * 0.2;
    
    // Better materials with lighting response
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: personColor,
      transparent: false
    });
    const limbMaterial = new THREE.MeshLambertMaterial({ 
      color: personColor.clone().multiplyScalar(0.9) // Slightly darker limbs
    });
    
    // Head (more detailed sphere)
    const headGeometry = new THREE.SphereGeometry(0.15 * sizeScale, 12, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.6 * sizeScale, 0);
    head.castShadow = true;
    this.group.add(head);
    
    // Body (more detailed cylinder with slight taper)
    const bodyGeometry = new THREE.CylinderGeometry(0.08 * sizeScale, 0.1 * sizeScale, 0.6 * sizeScale, 12);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.1 * sizeScale, 0);
    body.castShadow = true;
    this.group.add(body);
    
    // Arms (more detailed with slight taper)
    const armGeometry = new THREE.CylinderGeometry(0.025 * sizeScale, 0.035 * sizeScale, 0.4 * sizeScale, 8);
    
    this.leftArm = new THREE.Mesh(armGeometry, limbMaterial);
    this.leftArm.position.set(-0.15 * sizeScale, 0.25 * sizeScale, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);
    
    this.rightArm = new THREE.Mesh(armGeometry, limbMaterial);
    this.rightArm.position.set(0.15 * sizeScale, 0.25 * sizeScale, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);
    
    // Legs (more detailed with slight taper)
    const legGeometry = new THREE.CylinderGeometry(0.03 * sizeScale, 0.05 * sizeScale, 0.5 * sizeScale, 8);
    
    this.leftLeg = new THREE.Mesh(legGeometry, limbMaterial);
    this.leftLeg.position.set(-0.08 * sizeScale, -0.45 * sizeScale, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);
    
    this.rightLeg = new THREE.Mesh(legGeometry, limbMaterial);
    this.rightLeg.position.set(0.08 * sizeScale, -0.45 * sizeScale, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);
    
    // Add simple feet for better ground contact visual
    const footGeometry = new THREE.BoxGeometry(0.12 * sizeScale, 0.04 * sizeScale, 0.08 * sizeScale);
    const footMaterial = new THREE.MeshLambertMaterial({ color: personColor.clone().multiplyScalar(0.7) });
    
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(-0.08 * sizeScale, -0.72 * sizeScale, 0.02 * sizeScale);
    leftFoot.castShadow = true;
    this.group.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(0.08 * sizeScale, -0.72 * sizeScale, 0.02 * sizeScale);
    rightFoot.castShadow = true;
    this.group.add(rightFoot);
    
    // Set initial position
    this.group.position.y = -0.3; // Adjust so feet are on ground
  }
  
  public animate(deltaTime: number) {
    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
    
    if (this.isFalling) {
      // Falling animation
      this.fallVelocity += 0.01; // Gravity acceleration
      this.group.position.y -= this.fallVelocity;
      
      // Add tumbling rotation while falling
      this.fallRotationVelocity += 0.02;
      this.group.rotation.x += this.fallRotationVelocity * deltaTime * 10;
      this.group.rotation.z += this.fallRotationVelocity * deltaTime * 8;
      
      // Flail arms and legs while falling
      const flailTime = Date.now() * 0.02;
      this.leftArm.rotation.x = Math.sin(flailTime * 3) * 0.8;
      this.rightArm.rotation.x = Math.sin(flailTime * 2.5) * 0.8;
      this.leftLeg.rotation.x = Math.sin(flailTime * 2.8) * 0.6;
      this.rightLeg.rotation.x = Math.sin(flailTime * 3.2) * 0.6;
    } else {
      // Normal running animation
      this.animationTime += deltaTime * 8; // Running speed
      
      // Running animation - legs alternate
      const legSwing = Math.sin(this.animationTime) * 0.3;
      const armSwing = Math.sin(this.animationTime + Math.PI) * 0.2; // Arms opposite to legs
      
      // Leg animation (rotate around X axis for forward/back motion)
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      
      // Arm animation (subtle arm swing)
      this.leftArm.rotation.x = armSwing;
      this.rightArm.rotation.x = -armSwing;
      
      // Slight bob up and down
      const bobHeight = Math.abs(Math.sin(this.animationTime * 2)) * 0.05;
      this.group.position.y = -0.3 + bobHeight;
    }
  }

  public canShoot(): boolean {
    return !this.isFalling && this.shootCooldown <= 0;
  }

  public shoot(): THREE.Vector3 | null {
    if (!this.canShoot()) return null;
    
    this.shootCooldown = CONFIG.BULLET_RATE;
    
    // Return bullet spawn position (slightly in front of stick person)
    return new THREE.Vector3(
      this.group.position.x,
      this.group.position.y + 0.1, // Slightly above ground
      this.group.position.z - 0.2  // Slightly in front
    );
  }
  
  public setPosition(x: number, _y: number, z: number) {
    this.group.position.x = x;
    this.group.position.z = z;
    // Y is handled by animation unless falling
    if (!this.isFalling) {
      // Y position handled by animation for non-falling figures
    }
  }
  
  public startFalling() {
    this.isFalling = true;
    this.fallVelocity = 0;
    this.fallRotationVelocity = (Math.random() - 0.5) * 0.1; // Random initial rotation
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
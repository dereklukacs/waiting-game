import * as THREE from 'three';
import { CONFIG } from './config';

export class StickPerson {
  public group: THREE.Group;
  public leftLeg: THREE.Mesh;
  public rightLeg: THREE.Mesh;
  public leftArm: THREE.Mesh;
  public rightArm: THREE.Mesh;
  private animationTime: number = 0;

  constructor() {
    this.group = new THREE.Group();
    
    // Materials
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.CUBE });
    const limbMaterial = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.CUBE });
    
    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.15, 8, 6);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.6, 0);
    this.group.add(head);
    
    // Body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.6, 8);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.1, 0);
    this.group.add(body);
    
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
    
    this.leftArm = new THREE.Mesh(armGeometry, limbMaterial);
    this.leftArm.position.set(-0.15, 0.25, 0);
    this.group.add(this.leftArm);
    
    this.rightArm = new THREE.Mesh(armGeometry, limbMaterial);
    this.rightArm.position.set(0.15, 0.25, 0);
    this.group.add(this.rightArm);
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6);
    
    this.leftLeg = new THREE.Mesh(legGeometry, limbMaterial);
    this.leftLeg.position.set(-0.08, -0.45, 0);
    this.group.add(this.leftLeg);
    
    this.rightLeg = new THREE.Mesh(legGeometry, limbMaterial);
    this.rightLeg.position.set(0.08, -0.45, 0);
    this.group.add(this.rightLeg);
    
    // Set initial position
    this.group.position.y = -0.3; // Adjust so feet are on ground
  }
  
  public animate(deltaTime: number) {
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
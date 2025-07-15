import * as THREE from "three";
import { CONFIG } from "./config";
import { type WeaponStats } from "./WeaponUpgrade";

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
  private jumpTime: number = 0;
  private jumpCooldown: number = 0;
  private isJumping: boolean = false;
  public isDying: boolean = false;
  private deathStartTime: number = 0;
  private originalMaterials: THREE.Material[] = [];
  private deathMaterial: THREE.MeshLambertMaterial;
  private deathDuration: number = 500; // Base duration, will be randomized
  private deathFallAngle: number = 0; // Random fall angle
  private deathFallDistance: number = 0; // Random fall distance

  constructor() {
    this.group = new THREE.Group();
    this.variation = Math.random(); // For color/size variation

    // Create varied colors for better differentiation
    const hue = this.variation * 0.3 + 0.3; // Green to blue-green range
    const saturation = 0.6 + this.variation * 0.4;
    const lightness = 0.4 + this.variation * 0.3;
    const personColor = new THREE.Color().setHSL(hue, saturation, lightness);

    // Slightly varied size for individuality
    const sizeScale = 0.9 + this.variation * 0.2;

    // Better materials with lighting response
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: personColor,
      transparent: false,
    });
    const limbMaterial = new THREE.MeshLambertMaterial({
      color: personColor.clone().multiplyScalar(0.9), // Slightly darker limbs
    });

    // Create death material (red with slight variation)
    this.deathMaterial = new THREE.MeshLambertMaterial({
      color: 0xff0000,
      transparent: false,
    });

    // Head (more detailed sphere)
    const headGeometry = new THREE.SphereGeometry(0.15 * sizeScale, 12, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, 0.6 * sizeScale, 0);
    head.castShadow = true;
    this.group.add(head);
    this.originalMaterials.push(bodyMaterial);

    // Body (more detailed cylinder with slight taper)
    const bodyGeometry = new THREE.CylinderGeometry(
      0.08 * sizeScale,
      0.1 * sizeScale,
      0.6 * sizeScale,
      12
    );
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0.1 * sizeScale, 0);
    body.castShadow = true;
    this.group.add(body);
    this.originalMaterials.push(bodyMaterial);

    // Arms (more detailed with slight taper)
    const armGeometry = new THREE.CylinderGeometry(
      0.025 * sizeScale,
      0.035 * sizeScale,
      0.4 * sizeScale,
      8
    );

    this.leftArm = new THREE.Mesh(armGeometry, limbMaterial);
    this.leftArm.position.set(-0.15 * sizeScale, 0.25 * sizeScale, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);
    this.originalMaterials.push(limbMaterial);

    this.rightArm = new THREE.Mesh(armGeometry, limbMaterial);
    this.rightArm.position.set(0.15 * sizeScale, 0.25 * sizeScale, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);
    this.originalMaterials.push(limbMaterial);

    // Legs (more detailed with slight taper)
    const legGeometry = new THREE.CylinderGeometry(
      0.03 * sizeScale,
      0.05 * sizeScale,
      0.5 * sizeScale,
      8
    );

    this.leftLeg = new THREE.Mesh(legGeometry, limbMaterial);
    this.leftLeg.position.set(-0.08 * sizeScale, -0.45 * sizeScale, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);
    this.originalMaterials.push(limbMaterial);

    this.rightLeg = new THREE.Mesh(legGeometry, limbMaterial);
    this.rightLeg.position.set(0.08 * sizeScale, -0.45 * sizeScale, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);
    this.originalMaterials.push(limbMaterial);

    // Add simple feet for better ground contact visual
    const footGeometry = new THREE.BoxGeometry(
      0.12 * sizeScale,
      0.04 * sizeScale,
      0.08 * sizeScale
    );
    const footMaterial = new THREE.MeshLambertMaterial({
      color: personColor.clone().multiplyScalar(0.7),
    });

    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(
      -0.08 * sizeScale,
      -0.72 * sizeScale,
      0.02 * sizeScale
    );
    leftFoot.castShadow = true;
    this.group.add(leftFoot);
    this.originalMaterials.push(footMaterial);

    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(
      0.08 * sizeScale,
      -0.72 * sizeScale,
      0.02 * sizeScale
    );
    rightFoot.castShadow = true;
    this.group.add(rightFoot);
    this.originalMaterials.push(footMaterial);

    // Set initial position
    this.group.position.y = CONFIG.STICK_PERSON_GROUND_Y; // Position on road surface
  }

  public animate(deltaTime: number) {
    // Update shoot cooldown (delta time based)
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime * 60; // Convert to per-second cooldown
    }

    // Update jump cooldown (delta time based)
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= deltaTime * 60; // Convert to per-second cooldown
    }

    // Manual jumping only - no auto-jump

    if (this.isDying) {
      // Death animation - turn red and fall over with randomized parameters
      const deathProgress = Math.min(
        (Date.now() - this.deathStartTime) / this.deathDuration,
        1
      );

      // Change color to randomized red hue progressively
      let materialIndex = 0;
      this.group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const originalMaterial = this.originalMaterials[materialIndex];
          if (originalMaterial) {
            (child.material as THREE.MeshLambertMaterial).color.lerpColors(
              (originalMaterial as THREE.MeshLambertMaterial).color,
              this.deathMaterial.color,
              deathProgress
            );
            materialIndex++;
          }
        }
      });

      // Fall over at randomized angle with slight easing
      const easedProgress =
        deathProgress * deathProgress * (3 - 2 * deathProgress); // Smooth step easing
      this.group.rotation.z = easedProgress * this.deathFallAngle;

      // Fall down slightly with randomized timing
      const fallProgress = Math.min(deathProgress * 1.5, 1); // Fall slightly faster than rotation
      this.group.position.y =
        CONFIG.STICK_PERSON_GROUND_Y - fallProgress * this.deathFallDistance;

      // Add slight random wobble during death
      if (deathProgress < 0.8) {
        const wobbleFreq = 20 + Math.random() * 10;
        const wobbleAmount = (1 - deathProgress) * 0.05;
        this.group.rotation.x =
          Math.sin(Date.now() * wobbleFreq * 0.001) * wobbleAmount;
      }

      return; // Don't do other animations while dying
    } else if (this.isFalling) {
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
    } else if (this.isJumping) {
      // Jumping animation
      this.jumpTime++;

      // Calculate jump arc (parabola)
      const jumpProgress = this.jumpTime / CONFIG.STICK_PERSON_JUMP_DURATION;
      const jumpHeight =
        4 * CONFIG.STICK_PERSON_JUMP_HEIGHT * jumpProgress * (1 - jumpProgress);
      this.group.position.y = CONFIG.STICK_PERSON_GROUND_Y + jumpHeight;

      // Jump pose - legs tucked up, arms forward
      const tuckAmount = Math.sin(jumpProgress * Math.PI) * 0.8;
      this.leftLeg.rotation.x = tuckAmount;
      this.rightLeg.rotation.x = tuckAmount;
      this.leftArm.rotation.x = -0.3;
      this.rightArm.rotation.x = -0.3;

      // End jump when duration is complete
      if (this.jumpTime >= CONFIG.STICK_PERSON_JUMP_DURATION) {
        this.endJump();
      }
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

      // Keep on ground level (no bobbing - they're walking on the road)
      this.group.position.y = CONFIG.STICK_PERSON_GROUND_Y;
    }
  }

  private startJump() {
    this.isJumping = true;
    this.jumpTime = 0;
    this.jumpCooldown = CONFIG.STICK_PERSON_JUMP_RATE;
  }

  private endJump() {
    this.isJumping = false;
    this.jumpTime = 0;
    this.group.position.y = CONFIG.STICK_PERSON_GROUND_Y;
  }

  public canShoot(): boolean {
    return !this.isFalling && this.shootCooldown <= 0;
  }

  public canJump(): boolean {
    return !this.isFalling && !this.isJumping && this.jumpCooldown <= 0;
  }

  public jump(): boolean {
    if (!this.canJump()) return false;
    this.startJump();
    return true;
  }

  public shoot(weaponStats: WeaponStats): THREE.Vector3 | null {
    if (!this.canShoot()) return null;

    this.shootCooldown = weaponStats.rateOfFire;

    // Return bullet spawn position (from center of stick person)
    return new THREE.Vector3(
      this.group.position.x,
      this.group.position.y + 0.3, // At chest height
      this.group.position.z - 0.1 // Slightly in front
    );
  }

  public setPosition(x: number, _y: number, z: number) {
    this.group.position.x = x;
    this.group.position.z = z;
    // Y is handled by animation (walking, jumping, or falling)
    if (!this.isFalling && !this.isJumping) {
      this.group.position.y = CONFIG.STICK_PERSON_GROUND_Y;
    }
  }

  public startFalling() {
    this.isFalling = true;
    this.fallVelocity = 0;
    this.fallRotationVelocity = (Math.random() - 0.5) * 0.1; // Random initial rotation
  }

  public startDying() {
    this.isDying = true;
    this.deathStartTime = Date.now();

    // Randomize death parameters
    this.deathDuration = 400 + Math.random() * 200; // 400-600ms random duration
    this.deathFallAngle = (Math.random() - 0.5) * Math.PI * 0.3 + Math.PI * 0.5; // 45-135 degrees fall angle
    this.deathFallDistance = 0.2 + Math.random() * 0.2; // 0.2 to 0.4 fall distance

    // Create randomized death color (pure red variations)
    const redHue = 0; // Pure red (no hue variation)
    const saturation = 0.9 + Math.random() * 0.1; // 0.9 to 1.0 saturation (very saturated)
    const lightness = 0.25 + Math.random() * 0.35; // 0.25 to 0.6 lightness (darker to brighter red)
    this.deathMaterial.color.setHSL(redHue, saturation, lightness);
  }

  public isDeathAnimationComplete(): boolean {
    return (
      this.isDying && Date.now() - this.deathStartTime >= this.deathDuration
    );
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

    // Clean up death material
    if (this.deathMaterial) {
      this.deathMaterial.dispose();
    }

    // Clean up original materials
    this.originalMaterials.forEach((material) => {
      if (material) {
        material.dispose();
      }
    });
  }
}

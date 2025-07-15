import * as THREE from "three";
import { CONFIG } from "../config";
import { StickPerson } from "../StickPerson";

export interface GateEffect {
  type: "add" | "remove" | "multiply" | "custom";
  value?: number;
  probability?: number;
  customAction?: (
    cubeIndex: number,
    cubes: THREE.Mesh[],
    stickPeople: any[]
  ) => void;
}

export abstract class BaseGate {
  public group: THREE.Group;
  public isPositive: boolean;
  public side: "left" | "right";
  public pairId: number;
  public hasTriggered: boolean = false;
  protected color: number;
  protected effect: GateEffect;

  constructor(
    side: "left" | "right",
    isPositive: boolean,
    zPosition: number,
    pairId: number
  ) {
    this.group = new THREE.Group();
    this.side = side;
    this.isPositive = isPositive;
    this.pairId = pairId;
    this.color = isPositive
      ? CONFIG.COLORS.POSITIVE_GATE
      : CONFIG.COLORS.NEGATIVE_GATE;
    this.effect = this.defineEffect();

    this.createGateGeometry();
    this.group.position.set(0, -2, zPosition);

    // Add metadata to the group
    (this.group as any).isPositive = isPositive;
    (this.group as any).side = side;
    (this.group as any).pairId = pairId;
    (this.group as any).gateType = this.getGateType();
  }

  protected abstract defineEffect(): GateEffect;
  protected abstract createGateGeometry(): void;
  public abstract getGateType(): string;

  public checkCollision(cubePosition: THREE.Vector3): boolean {
    let inGateRange = false;

    if (this.side === "left") {
      // Left gate spans from x = -3 to x = 0
      inGateRange = cubePosition.x >= -3 && cubePosition.x <= 0;
    } else if (this.side === "right") {
      // Right gate spans from x = 0 to x = 3
      inGateRange = cubePosition.x >= 0 && cubePosition.x <= 3;
    }

    return inGateRange && Math.abs(this.group.position.z - cubePosition.z) < 1;
  }

  public applyEffect(
    cubeIndex: number,
    cubes: THREE.Mesh[],
    stickPeople: any[],
    scene: THREE.Scene,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    cubeVelocities: THREE.Vector3[]
  ): { mobCountChange: number; shouldRemove: boolean } {
    switch (this.effect.type) {
      case "add":
        if (Math.random() < (this.effect.probability || 1)) {
          return this.addChallenger(
            cubeIndex,
            cubes,
            stickPeople,
            scene,
            geometry,
            material,
            cubeVelocities
          );
        }
        break;
      case "remove":
        return this.removeChallenger(
          cubeIndex,
          cubes,
          stickPeople,
          scene,
          cubeVelocities
        );
      case "multiply":
        return this.multiplyChallengers(
          cubeIndex,
          cubes,
          stickPeople,
          scene,
          geometry,
          material,
          cubeVelocities
        );
      case "custom":
        if (this.effect.customAction) {
          this.effect.customAction(cubeIndex, cubes, stickPeople);
        }
        break;
    }
    return { mobCountChange: 0, shouldRemove: false };
  }

  protected addChallenger(
    cubeIndex: number,
    cubes: THREE.Mesh[],
    stickPeople: any[],
    scene: THREE.Scene,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    cubeVelocities: THREE.Vector3[]
  ): { mobCountChange: number; shouldRemove: boolean } {
    const testCube = cubes[cubeIndex];

    // Create new collision box (invisible)
    const newCube = new THREE.Mesh(geometry, material.clone());
    newCube.visible = false;
    newCube.position.set(
      testCube.position.x + CONFIG.RNG.cubeSpawnOffsetX(),
      testCube.position.y,
      testCube.position.z + CONFIG.RNG.cubeSpawnOffsetZ()
    );
    scene.add(newCube);
    cubes.push(newCube);
    cubeVelocities.push(new THREE.Vector3(0, 0, 0));

    // Create new stick person (visible)
    const newStickPerson = new StickPerson();
    newStickPerson.setPosition(
      newCube.position.x,
      newCube.position.y,
      newCube.position.z
    );
    scene.add(newStickPerson.group);
    stickPeople.push(newStickPerson);

    return { mobCountChange: 1, shouldRemove: false };
  }

  protected removeChallenger(
    cubeIndex: number,
    cubes: THREE.Mesh[],
    _stickPeople: any[],
    scene: THREE.Scene,
    _cubeVelocities: THREE.Vector3[]
  ): { mobCountChange: number; shouldRemove: boolean } {
    const testCube = cubes[cubeIndex];
    scene.remove(testCube);
    testCube.geometry.dispose();
    (testCube.material as THREE.Material).dispose();

    // Death animation will be handled in App.tsx when shouldRemove is true

    return { mobCountChange: -1, shouldRemove: true };
  }

  protected multiplyChallengers(
    cubeIndex: number,
    cubes: THREE.Mesh[],
    stickPeople: any[],
    scene: THREE.Scene,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    cubeVelocities: THREE.Vector3[]
  ): { mobCountChange: number; shouldRemove: boolean } {
    const multiplier = this.effect.value || 2;
    let addedCount = 0;

    for (let i = 0; i < multiplier - 1; i++) {
      const result = this.addChallenger(
        cubeIndex,
        cubes,
        stickPeople,
        scene,
        geometry,
        material,
        cubeVelocities
      );
      addedCount += result.mobCountChange;
    }

    return { mobCountChange: addedCount, shouldRemove: false };
  }

  public dispose(): void {
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

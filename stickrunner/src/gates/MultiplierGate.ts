import * as THREE from "three";
import { BaseGate } from "./BaseGate";
import type { GateEffect } from "./BaseGate";

export class MultiplierGate extends BaseGate {
  private multiplier: number;

  constructor(
    side: "left" | "right",
    isPositive: boolean,
    zPosition: number,
    pairId: number,
    multiplier: number = 2
  ) {
    super(side, isPositive, zPosition, pairId);
    this.multiplier = multiplier;
  }

  protected defineEffect(): GateEffect {
    if (this.isPositive) {
      return {
        type: "multiply",
        value: this.multiplier,
      };
    } else {
      return {
        type: "remove",
      };
    }
  }

  protected createGateGeometry(): void {
    const postGeometry = new THREE.BoxGeometry(0.4, 3.5, 0.4);
    const postMaterial = new THREE.MeshBasicMaterial({ color: this.color });

    // Create thicker posts for multiplier gates
    const innerPost = new THREE.Mesh(postGeometry, postMaterial);
    const outerPost = new THREE.Mesh(postGeometry, postMaterial);

    if (this.side === "left") {
      innerPost.position.set(-0.2, 0.5, 0);
      outerPost.position.set(-3, 0.5, 0);
    } else {
      innerPost.position.set(0.2, 0.5, 0);
      outerPost.position.set(3, 0.5, 0);
    }

    this.group.add(innerPost);
    this.group.add(outerPost);

    // Create animated force field with pulsing effect
    const forceFieldGeometry = new THREE.PlaneGeometry(3, 3);
    const forceFieldMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });

    const forceField = new THREE.Mesh(forceFieldGeometry, forceFieldMaterial);
    forceField.position.set(this.side === "left" ? -1.5 : 1.5, 0.5, 0);

    this.group.add(forceField);

    // Add multiplier indicator (floating text/symbol)
    this.addMultiplierIndicator();
  }

  private addMultiplierIndicator(): void {
    // Create a simple geometric indicator for the multiplier
    const indicatorGeometry = new THREE.RingGeometry(0.3, 0.5, 8);
    const indicatorMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.set(this.side === "left" ? -1.5 : 1.5, 2, 0);
    indicator.rotation.x = -Math.PI / 2; // Lay flat

    this.group.add(indicator);

    // Add inner circles for multiplier value
    for (let i = 0; i < Math.min(this.multiplier, 4); i++) {
      const dotGeometry = new THREE.CircleGeometry(0.05, 8);
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 1,
      });

      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      const angle = (i / Math.max(this.multiplier - 1, 1)) * Math.PI * 2;
      dot.position.set(
        (this.side === "left" ? -1.5 : 1.5) + Math.cos(angle) * 0.2,
        2,
        Math.sin(angle) * 0.2
      );
      dot.rotation.x = -Math.PI / 2;

      this.group.add(dot);
    }
  }

  public getGateType(): string {
    return `multiplier_${this.multiplier}`;
  }
}

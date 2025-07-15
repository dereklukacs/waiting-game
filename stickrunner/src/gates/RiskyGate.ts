import * as THREE from "three";
import { BaseGate } from "./BaseGate";
import type { GateEffect } from "./BaseGate";
import { CONFIG } from "../config";

export class RiskyGate extends BaseGate {
  private rewardMultiplier: number;
  private riskProbability: number;

  constructor(
    side: "left" | "right",
    isPositive: boolean,
    zPosition: number,
    pairId: number,
    rewardMultiplier: number = 3,
    riskProbability: number = 0.3
  ) {
    super(side, isPositive, zPosition, pairId);
    this.rewardMultiplier = rewardMultiplier;
    this.riskProbability = riskProbability;
  }

  protected defineEffect(): GateEffect {
    if (this.isPositive) {
      // Risky gate decides effect dynamically
      if (Math.random() < this.riskProbability) {
        return { type: "remove" }; // Risk outcome
      } else {
        return { type: "multiply", value: this.rewardMultiplier }; // Reward outcome
      }
    } else {
      return {
        type: "remove",
      };
    }
  }

  protected createGateGeometry(): void {
    // Create alternating colored segments for risky appearance
    const segments = 4;
    const segmentHeight = 3.2 / segments;

    for (let i = 0; i < segments; i++) {
      const segmentColor =
        i % 2 === 0
          ? this.color
          : this.color === CONFIG.COLORS.POSITIVE_GATE
          ? 0xffaa00
          : 0x660000;
      const segmentMaterial = new THREE.MeshBasicMaterial({
        color: segmentColor,
      });
      const segmentGeometry = new THREE.BoxGeometry(0.35, segmentHeight, 0.35);

      const innerSegment = new THREE.Mesh(segmentGeometry, segmentMaterial);
      const outerSegment = new THREE.Mesh(segmentGeometry, segmentMaterial);

      const yPos =
        0.5 -
        (segmentHeight * segments) / 2 +
        i * segmentHeight +
        segmentHeight / 2;

      if (this.side === "left") {
        innerSegment.position.set(-0.2, yPos, 0);
        outerSegment.position.set(-3, yPos, 0);
      } else {
        innerSegment.position.set(0.2, yPos, 0);
        outerSegment.position.set(3, yPos, 0);
      }

      this.group.add(innerSegment);
      this.group.add(outerSegment);
    }

    // Create pulsing force field
    const forceFieldGeometry = new THREE.PlaneGeometry(3, 3);
    const forceFieldMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });

    const forceField = new THREE.Mesh(forceFieldGeometry, forceFieldMaterial);
    forceField.position.set(this.side === "left" ? -1.5 : 1.5, 0.5, 0);

    this.group.add(forceField);

    // Add warning indicator
    this.addWarningIndicator();
  }

  private addWarningIndicator(): void {
    // Create warning triangle
    const triangleGeometry = new THREE.ConeGeometry(0.3, 0.5, 3);
    const triangleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });

    const triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
    triangle.position.set(this.side === "left" ? -1.5 : 1.5, 2.5, 0);
    triangle.rotation.x = Math.PI; // Point down

    this.group.add(triangle);

    // Add exclamation mark (simple line)
    const lineGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(this.side === "left" ? -1.5 : 1.5, 2.5, 0);

    this.group.add(line);
  }

  public getGateType(): string {
    return `risky_${this.rewardMultiplier}x`;
  }
}

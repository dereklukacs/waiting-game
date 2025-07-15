import * as THREE from "three";
import { BaseGate, type GateEffect } from "./BaseGate";
import { CONFIG } from "../config";

export class BasicGate extends BaseGate {
  protected defineEffect(): GateEffect {
    if (this.isPositive) {
      return {
        type: "add",
        probability: CONFIG.BLUE_GATE_DUPLICATION_CHANCE,
      };
    } else {
      return {
        type: "remove",
      };
    }
  }

  protected createGateGeometry(): void {
    const postGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
    const postMaterial = new THREE.MeshBasicMaterial({ color: this.color });

    // Create posts
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

    // Create force field
    const forceFieldGeometry = new THREE.PlaneGeometry(3, 3);
    const forceFieldMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    const forceField = new THREE.Mesh(forceFieldGeometry, forceFieldMaterial);
    forceField.position.set(this.side === "left" ? -1.5 : 1.5, 0.5, 0);

    this.group.add(forceField);
  }

  public getGateType(): string {
    return "basic";
  }
}

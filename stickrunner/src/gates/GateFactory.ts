import { BaseGate } from './BaseGate';
import { BasicGate } from './BasicGate';
import { MultiplierGate } from './MultiplierGate';
import { RiskyGate } from './RiskyGate';
import { CONFIG } from '../config';

export interface GateTypeConfig {
  type: string;
  weight: number;
  minLevel?: number;
  maxLevel?: number;
  params?: any;
}

export class GateFactory {
  private gateTypes: GateTypeConfig[] = [
    { type: 'basic', weight: 70, minLevel: 1 },
    { type: 'multiplier_2', weight: 20, minLevel: 2, params: { multiplier: 2 } },
    { type: 'multiplier_3', weight: 8, minLevel: 5, params: { multiplier: 3 } },
    { type: 'risky_3', weight: 15, minLevel: 3, params: { rewardMultiplier: 3, riskProbability: 0.3 } },
    { type: 'risky_4', weight: 5, minLevel: 7, params: { rewardMultiplier: 4, riskProbability: 0.4 } },
  ];
  
  public createGatePair(zPosition: number, level: number = 1): BaseGate[] {
    // Filter available gate types based on level
    const availableTypes = this.gateTypes.filter(gateType => 
      (!gateType.minLevel || level >= gateType.minLevel) &&
      (!gateType.maxLevel || level <= gateType.maxLevel)
    );
    
    // Select gate type based on weighted random selection
    const selectedType = this.selectWeightedRandom(availableTypes);
    
    // Randomly assign which side gets positive/negative
    const leftIsPositive = CONFIG.RNG.isLeftGatePositive();
    
    // Create gate pair
    const leftGate = this.createGate(selectedType, 'left', leftIsPositive, zPosition, zPosition);
    const rightGate = this.createGate(selectedType, 'right', !leftIsPositive, zPosition, zPosition);
    
    return [leftGate, rightGate];
  }
  
  private selectWeightedRandom(types: GateTypeConfig[]): GateTypeConfig {
    const totalWeight = types.reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const type of types) {
      random -= type.weight;
      if (random <= 0) {
        return type;
      }
    }
    
    // Fallback to basic gate
    return types.find(t => t.type === 'basic') || types[0];
  }
  
  private createGate(
    gateType: GateTypeConfig,
    side: 'left' | 'right',
    isPositive: boolean,
    zPosition: number,
    pairId: number
  ): BaseGate {
    const params = gateType.params || {};
    
    switch (gateType.type) {
      case 'basic':
        return new BasicGate(side, isPositive, zPosition, pairId);
      
      case 'multiplier_2':
      case 'multiplier_3':
        return new MultiplierGate(
          side,
          isPositive,
          zPosition,
          pairId,
          params.multiplier || 2
        );
      
      case 'risky_3':
      case 'risky_4':
        return new RiskyGate(
          side,
          isPositive,
          zPosition,
          pairId,
          params.rewardMultiplier || 3,
          params.riskProbability || 0.3
        );
      
      default:
        return new BasicGate(side, isPositive, zPosition, pairId);
    }
  }
  
  public addGateType(config: GateTypeConfig): void {
    this.gateTypes.push(config);
  }
  
  public removeGateType(type: string): void {
    this.gateTypes = this.gateTypes.filter(gt => gt.type !== type);
  }
  
  public updateGateTypeWeight(type: string, weight: number): void {
    const gateType = this.gateTypes.find(gt => gt.type === type);
    if (gateType) {
      gateType.weight = weight;
    }
  }
  
  public getAvailableGateTypes(level: number = 1): string[] {
    return this.gateTypes
      .filter(gateType => 
        (!gateType.minLevel || level >= gateType.minLevel) &&
        (!gateType.maxLevel || level <= gateType.maxLevel)
      )
      .map(gateType => gateType.type);
  }
}
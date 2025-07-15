import { CONFIG } from './config';

export interface WeaponStats {
  damage: number;
  bulletVelocity: number;
  rateOfFire: number; // Frames between shots
}

export interface UpgradeInfo {
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
}

export class WeaponUpgrade {
  private stats: WeaponStats;
  private upgradeLevels: {
    damage: number;
    bulletVelocity: number;
    rateOfFire: number;
  };
  
  constructor() {
    // Initialize with base weapon stats
    this.stats = {
      damage: CONFIG.BULLET_BASE_DAMAGE,
      bulletVelocity: CONFIG.BULLET_SPEED,
      rateOfFire: CONFIG.BULLET_RATE
    };
    
    this.upgradeLevels = {
      damage: 0,
      bulletVelocity: 0,
      rateOfFire: 0
    };
  }
  
  public getStats(): WeaponStats {
    return { ...this.stats };
  }
  
  public getUpgradeInfo(): UpgradeInfo[] {
    return [
      {
        name: "Damage",
        description: `+1 damage per bullet`,
        cost: Math.floor(10 + this.upgradeLevels.damage * 5),
        maxLevel: 20,
        currentLevel: this.upgradeLevels.damage
      },
      {
        name: "Velocity",
        description: `+10% bullet speed`,
        cost: Math.floor(15 + this.upgradeLevels.bulletVelocity * 8),
        maxLevel: 15,
        currentLevel: this.upgradeLevels.bulletVelocity
      },
      {
        name: "Rate of Fire",
        description: `Faster shooting`,
        cost: Math.floor(20 + this.upgradeLevels.rateOfFire * 10),
        maxLevel: 10,
        currentLevel: this.upgradeLevels.rateOfFire
      }
    ];
  }
  
  public canPurchaseUpgrade(upgradeType: 'damage' | 'bulletVelocity' | 'rateOfFire', coins: number): boolean {
    const upgradeInfo = this.getUpgradeInfo();
    let index = 0;
    
    switch (upgradeType) {
      case 'damage':
        index = 0;
        break;
      case 'bulletVelocity':
        index = 1;
        break;
      case 'rateOfFire':
        index = 2;
        break;
    }
    
    const info = upgradeInfo[index];
    return coins >= info.cost && info.currentLevel < info.maxLevel;
  }
  
  public purchaseUpgrade(upgradeType: 'damage' | 'bulletVelocity' | 'rateOfFire', coins: number): { success: boolean; newCoinCount: number } {
    if (!this.canPurchaseUpgrade(upgradeType, coins)) {
      return { success: false, newCoinCount: coins };
    }
    
    const upgradeInfo = this.getUpgradeInfo();
    let index = 0;
    
    switch (upgradeType) {
      case 'damage':
        index = 0;
        this.upgradeLevels.damage++;
        this.stats.damage += 1;
        break;
      case 'bulletVelocity':
        index = 1;
        this.upgradeLevels.bulletVelocity++;
        this.stats.bulletVelocity *= 1.1;
        break;
      case 'rateOfFire':
        index = 2;
        this.upgradeLevels.rateOfFire++;
        this.stats.rateOfFire = Math.max(5, this.stats.rateOfFire - 3);
        break;
    }
    
    const cost = upgradeInfo[index].cost;
    this.saveToLocalStorage(); // Save upgrades after purchase
    return { success: true, newCoinCount: coins - cost };
  }
  
  public upgradeDamage(amount: number = 1): void {
    this.stats.damage += amount;
  }
  
  public upgradeBulletVelocity(multiplier: number = 1.2): void {
    this.stats.bulletVelocity *= multiplier;
  }
  
  public upgradeRateOfFire(reduction: number = 5): void {
    this.stats.rateOfFire = Math.max(5, this.stats.rateOfFire - reduction); // Minimum 5 frames
  }
  
  public saveToLocalStorage(): void {
    const saveData = {
      upgradeLevels: this.upgradeLevels,
      stats: this.stats
    };
    localStorage.setItem('stickrunner-weapon-upgrades', JSON.stringify(saveData));
  }
  
  public loadFromLocalStorage(): void {
    const savedData = localStorage.getItem('stickrunner-weapon-upgrades');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.upgradeLevels && parsed.stats) {
          this.upgradeLevels = parsed.upgradeLevels;
          this.stats = parsed.stats;
        }
      } catch (error) {
        console.warn('Failed to load weapon upgrades from localStorage:', error);
      }
    }
  }
  
  public reset(): void {
    this.stats = {
      damage: CONFIG.BULLET_BASE_DAMAGE,
      bulletVelocity: CONFIG.BULLET_SPEED,
      rateOfFire: CONFIG.BULLET_RATE
    };
    
    this.upgradeLevels = {
      damage: 0,
      bulletVelocity: 0,
      rateOfFire: 0
    };
  }
}
class StatusManager {
  constructor() {
    this.state = 'working';
    this.lastUpdate = Date.now();
    this.listeners = [];
    console.log('[StatusManager] Starting in working state');
  }

  setState(newState) {
    const previousState = this.state;
    this.state = newState;
    this.lastUpdate = Date.now();
    
    console.log(`[StatusManager] State changed: ${previousState} → ${newState}`);
    
    this.listeners.forEach(listener => {
      try {
        listener(newState, previousState);
      } catch (error) {
        console.error('[StatusManager] Error in listener:', error);
      }
    });
  }

  getStatus() {
    return {
      state: this.state,
      lastUpdate: this.lastUpdate,
      timestamp: Date.now()
    };
  }

  onStateChange(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  markWorking() {
    this.setState('working');
  }

  markIdle() {
    this.setState('idle');
  }

  markToolExecuting() {
    this.setState('tool-executing');
  }
}

module.exports = StatusManager;
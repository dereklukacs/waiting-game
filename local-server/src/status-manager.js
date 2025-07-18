class StatusManager {
  constructor() {
    this.state = 'working';
    this.lastUpdate = Date.now();
    this.listeners = [];
    this.idleTimeout = null;
    this.IDLE_THRESHOLD = 30000; // 30 seconds of inactivity = idle
    console.log('[StatusManager] Starting in working state');
    
    this.startIdleTimer();
  }

  setState(newState) {
    const previousState = this.state;
    this.state = newState;
    this.lastUpdate = Date.now();
    
    console.log(`[StatusManager] State changed: ${previousState} → ${newState}`);
    
    // Reset idle timer on any state change
    this.startIdleTimer();
    
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

  markWaitingForPermission() {
    this.setState('waiting-permission');
  }

  startIdleTimer() {
    // Clear existing timer
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
    
    // Only set idle timer if not already idle
    if (this.state !== 'idle') {
      this.idleTimeout = setTimeout(() => {
        console.log('[StatusManager] No activity detected, marking as idle');
        this.setState('idle');
      }, this.IDLE_THRESHOLD);
    }
  }

  cleanup() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }
}

module.exports = StatusManager;
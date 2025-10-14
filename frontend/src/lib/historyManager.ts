// Event emitter for updating incident history when new recordings are made
type HistoryUpdateListener = () => void;

class HistoryUpdateManager {
  private listeners: HistoryUpdateListener[] = [];

  // Subscribe to history updates
  subscribe(listener: HistoryUpdateListener) {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners that history should be refreshed
  notifyHistoryUpdate() {
    console.log('Notifying history update to', this.listeners.length, 'listeners');
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in history update listener:', error);
      }
    });
  }
}

// Global instance
export const historyUpdateManager = new HistoryUpdateManager();

// Convenience function to trigger history refresh
export const triggerHistoryRefresh = () => {
  console.log('triggerHistoryRefresh called');
  historyUpdateManager.notifyHistoryUpdate();
};

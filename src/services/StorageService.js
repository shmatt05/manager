import { auth, database } from '../firebase';
import { ref, set, get } from 'firebase/database';
import { config } from '../config';

/**
 * Local storage implementation
 */
const localStore = {
  saveData: (data) => {
    localStorage.setItem('taskMatrix', JSON.stringify(data));
    return Promise.resolve();
  },
  loadData: () => {
    const data = localStorage.getItem('taskMatrix');
    return Promise.resolve(data ? JSON.parse(data) : null);
  }
};

/**
 * Firebase storage implementation
 */
const createFirebaseStore = () => {
  return {
    saveData: async (data) => {
      if (!auth?.currentUser) {
        return localStore.saveData(data);
      }
      const tasksRef = ref(database, `users/${auth.currentUser.uid}/tasks`);
      await set(tasksRef, data);
      return data;
    },
    loadData: async () => {
      if (!auth?.currentUser) {
        return localStore.loadData();
      }
      try {
        const tasksRef = ref(database, `users/${auth.currentUser.uid}/tasks`);
        const snapshot = await get(tasksRef);
        return snapshot.val() || null;
      } catch (error) {
        console.error('Error loading data from Firebase:', error);
        return localStore.loadData();
      }
    }
  };
};

/**
 * Storage Service
 */
class StorageService {
  constructor() {
    this.store = localStore;
    this.setupComplete = false;
    this.initializeStore();
  }

  /**
   * Initialize the appropriate storage mechanism
   */
  async initializeStore() {
    if (config.isFeatureEnabled('firebase-storage')) {
      try {
        // Wait for auth to be available
        const maxRetries = 10;
        let retries = 0;
        
        while (!auth && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
        
        this.store = createFirebaseStore();
      } catch (error) {
        console.error('Failed to initialize Firebase storage:', error);
        this.store = localStore;
      }
    } else {
      this.store = localStore;
    }
    
    this.setupComplete = true;
  }

  /**
   * Check if storage is ready to use
   */
  isReady() {
    return this.setupComplete;
  }

  /**
   * Save data to storage
   */
  async saveData(data) {
    if (!this.setupComplete) {
      await this.waitForSetup();
    }
    return this.store.saveData(data);
  }

  /**
   * Load data from storage
   */
  async loadData() {
    if (!this.setupComplete) {
      await this.waitForSetup();
    }
    return this.store.loadData();
  }

  /**
   * Wait for storage setup to complete
   */
  async waitForSetup() {
    const maxWait = 3000; // 3 seconds max
    const startTime = Date.now();
    
    while (!this.setupComplete && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.setupComplete) {
      console.warn('Storage setup timed out, falling back to local storage');
      this.store = localStore;
      this.setupComplete = true;
    }
  }
}

export const storage = new StorageService();
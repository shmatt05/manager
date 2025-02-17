import { auth } from '../firebase';

// Local storage implementation
const localStore = {
  saveData: (data) => {
    console.log('[Storage] Saving to local storage');
    localStorage.setItem('taskMatrix', JSON.stringify(data));
    return Promise.resolve();
  },
  loadData: () => {
    console.log('[Storage] Loading from local storage');
    const data = localStorage.getItem('taskMatrix');
    return Promise.resolve(data ? JSON.parse(data) : null);
  }
};

// Create a proxy that will use either local storage or Firebase
const storage = new Proxy({}, {
  get: (target, prop) => {
    console.log('[Storage] Accessing property:', prop, 'Target has prop:', prop in target);
    if (prop in target) {
      console.log('[Storage] Returning existing prop');
      return target[prop];
    }
    console.log('[Storage] Creating proxy method');
    return (...args) => {
      console.log('[Storage] Calling method:', prop, 'Args:', args);
      return localStore[prop](...args);
    };
  }
});

// In production, load Firebase implementation
if (import.meta.env.PROD && import.meta.env.VITE_USE_FIREBASE === 'true') {
  console.log('[Storage] Loading Firebase implementation');
  let setupComplete = false;

  import('./storageImpl.js')
    .then(module => {
      console.log('[Storage] Firebase implementation loaded');
      const createFirebaseStore = module.default;
      return createFirebaseStore();
    })
    .then(firebaseStore => {
      console.log('[Storage] Firebase store created with methods:', Object.keys(firebaseStore));
      console.log('[Storage] Current storage methods:', Object.keys(storage));
      Object.assign(storage, firebaseStore);
      setupComplete = true;
      console.log('[Storage] Setup complete');
    })
    .catch(error => {
      console.error('[Storage] Error setting up Firebase store:', error);
      setupComplete = true;
    });

  // Add a way to check if setup is complete
  storage.isReady = () => setupComplete;
}

export { storage }; 
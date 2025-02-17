// Local storage implementation
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

// Create a proxy that will use either local storage or Firebase
const storage = new Proxy({}, {
  get: (target, prop) => {
    return (...args) => localStore[prop](...args);
  }
});

// In production, load Firebase implementation
if (import.meta.env.PROD && import.meta.env.VITE_USE_FIREBASE === 'true') {
  import('./storageImpl.js').then(module => {
    const createFirebaseStore = module.default;
    createFirebaseStore().then(firebaseStore => {
      Object.assign(storage, firebaseStore);
    });
  });
}

export { storage }; 
import { auth, database } from '../firebase';
import { ref, set, get } from 'firebase/database';

const createFirebaseStore = async () => {
  console.log('[StorageImpl] Creating Firebase store');
  
  const store = {
    saveData: async (data) => {
      console.log('[StorageImpl] Saving data, auth state:', auth?.currentUser?.email);
      if (!auth?.currentUser) {
        console.log('[StorageImpl] No user, using local storage');
        return localStore.saveData(data);
      }
      const tasksRef = ref(database, `users/${auth.currentUser.uid}/tasks`);
      await set(tasksRef, data);
      console.log('[StorageImpl] Data saved to Firebase');
    },
    loadData: async () => {
      console.log('[StorageImpl] Loading data, auth state:', auth?.currentUser?.email);
      if (!auth?.currentUser) {
        console.log('[StorageImpl] No user, using local storage');
        return localStore.loadData();
      }
      const tasksRef = ref(database, `users/${auth.currentUser.uid}/tasks`);
      const snapshot = await get(tasksRef);
      console.log('[StorageImpl] Data loaded from Firebase');
      return snapshot.val() || null;
    }
  };

  console.log('[StorageImpl] Store created');
  return store;
};

export default createFirebaseStore; 
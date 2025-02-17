const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
});

const createFirebaseStore = async () => {
  const [
    { initializeApp }, 
    { getAuth }, 
    { getDatabase, ref, set, get }
  ] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/database')
  ]);

  const app = initializeApp(getFirebaseConfig());
  const auth = getAuth(app);
  const database = getDatabase(app);

  return {
    saveData: async (data) => {
      if (!auth.currentUser) {
        return localStore.saveData(data);
      }
      const tasksRef = ref(database, `users/${auth.currentUser.uid}/tasks`);
      await set(tasksRef, data);
    },
    loadData: async () => {
      if (!auth.currentUser) {
        return localStore.loadData();
      }
      const tasksRef = ref(database, `users/${auth.currentUser.uid}/tasks`);
      const snapshot = await get(tasksRef);
      return snapshot.val() || null;
    },
    auth
  };
};

export default createFirebaseStore; 
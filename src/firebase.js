import { initializeApp, getApp } from 'firebase/app'
// Import other necessary Firebase services
import { getFirestore } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

// Only initialize Firebase in production and when VITE_USE_FIREBASE is true
let app = null;
let db = null;
let auth = null;
let database = null;

if (import.meta.env.PROD && import.meta.env.VITE_USE_FIREBASE === 'true') {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  console.log('[Firebase] Initialization attempt');

  try {
    app = getApp();
    console.log('[Firebase] Retrieved existing app');
  } catch {
    console.log('[Firebase] Initializing new app');
    app = initializeApp(firebaseConfig);
  }

  try {
    console.log('[Firebase] Initializing auth');
    auth = getAuth(app);
    console.log('[Firebase] Auth initialized');

    console.log('[Firebase] Initializing other services');
    db = getFirestore(app);
    database = getDatabase(app);
    console.log('[Firebase] All services initialized');
  } catch (error) {
    console.error('[Firebase] Error during service initialization:', error);
  }
}

// Add a check to see if this module is being imported multiple times
console.log('[Firebase] Module loaded at:', new Date().toISOString());

// Export services and initialization status
export { db, auth, database };

// Add a way to check if Firebase is ready
export const isFirebaseReady = () => {
  return !!(app && auth && db && database);
}; 
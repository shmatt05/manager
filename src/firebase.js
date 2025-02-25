import { initializeApp, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
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

  try {
    app = getApp();
  } catch {
    app = initializeApp(firebaseConfig);
  }

  try {
    auth = getAuth(app);
    db = getFirestore(app);
    database = getDatabase(app);
  } catch (error) {
    // Silently fail, services will be null
  }
}

// Export services and initialization status
export { db, auth, database };

// Add a way to check if Firebase is ready
export const isFirebaseReady = () => {
  return !!(app && auth && db && database);
}; 
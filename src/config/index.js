/**
 * Configuration service with feature flags and environment variables
 */
export const config = {
  isProd: import.meta.env.PROD,
  useFirebase: import.meta.env.PROD && import.meta.env.VITE_USE_FIREBASE === 'true',
  
  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled: (feature) => {
    const features = {
      'firebase-auth': config.useFirebase,
      'firebase-storage': config.useFirebase,
      'history-tracking': true
    };
    return features[feature] || false;
  },

  /**
   * Get Firebase configuration
   */
  getFirebaseConfig: () => ({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  })
};
import { useState, useEffect } from 'react';
import { isFirebaseReady } from '../firebase';

function AuthButtonContent() {
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    console.log('[AuthButton] Starting dynamic import');
    
    const loadImpl = async () => {
      try {
        // Wait for Firebase to be ready
        if (!isFirebaseReady()) {
          console.log('[AuthButton] Waiting for Firebase...');
          return;
        }
        
        console.log('[AuthButton] Firebase ready, loading implementation');
        const module = await import('./AuthButtonImpl.jsx');
        console.log('[AuthButton] Implementation loaded');
        setComponent(() => module.default);
      } catch (error) {
        console.error('[AuthButton] Failed to load implementation:', error);
      }
    };

    loadImpl();
  }, []);

  if (!Component) {
    return <div>Loading auth...</div>;
  }

  return <Component />;
}

export default function AuthButton() {
  // Move the conditional check outside of the component body
  if (!import.meta.env.PROD || import.meta.env.VITE_USE_FIREBASE !== 'true') {
    return null;
  }

  return <AuthButtonContent />;
} 
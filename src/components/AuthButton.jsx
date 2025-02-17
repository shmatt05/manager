import { useState, useEffect } from 'react';

export default function AuthButton() {
  // Don't render anything in development
  if (!import.meta.env.PROD || import.meta.env.VITE_USE_FIREBASE !== 'true') {
    return null;
  }

  // Dynamic imports for production only
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    // Only load the real implementation in production
    import('./AuthButtonImpl.jsx')
      .then(module => setComponent(() => module.default))
      .catch(console.error);
  }, []);

  return Component ? <Component /> : null;
} 
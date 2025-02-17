import { useState, useEffect } from 'react';

export default function AuthButtonImpl() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { storage } = await import('../utils/storage');
      if (storage.auth) {
        storage.auth.onAuthStateChanged((user) => {
          setUser(user);
          setLoading(false);
        });
      }
    };

    initAuth();
  }, []);

  const handleLogin = async () => {
    const { storage } = await import('../utils/storage');
    if (storage.auth) {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(storage.auth, provider);
    }
  };

  const handleLogout = async () => {
    const { storage } = await import('../utils/storage');
    if (storage.auth) {
      await storage.auth.signOut();
    }
  };

  if (loading) return null;

  return (
    <div className="px-4 py-2">
      {user ? (
        <button 
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Sign Out
        </button>
      ) : (
        <button 
          onClick={handleLogin}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Sign In with Google
        </button>
      )}
    </div>
  );
} 
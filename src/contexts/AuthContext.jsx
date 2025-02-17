import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isProd = import.meta.env.PROD;

  console.log('[AuthContext] Provider rendering, current user:', user?.email);

  useEffect(() => {
    if (isProd) {
      console.log('[AuthContext] Setting up auth listener');
      const unsubscribe = auth?.onAuthStateChanged((user) => {
        console.log('[AuthContext] Auth state changed:', {
          userEmail: user?.email,
          timestamp: new Date().toISOString()
        });
        if (user) {
          setUser(user);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => {
        console.log('[AuthContext] Cleaning up auth listener');
        unsubscribe && unsubscribe();
      };
    } else {
      // In development, simulate a logged-in user
      setUser({ uid: 'dev-user', email: 'dev@example.com' });
      setLoading(false);
    }
  }, [isProd]);

  const signIn = async () => {
    console.log('[AuthContext] Initiating sign in');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('[AuthContext] Sign in successful:', result.user.email);
      return result;
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] Initiating sign out');
    try {
      await firebaseSignOut(auth);
      console.log('[AuthContext] Sign out successful');
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    signIn,
    signOut,
    loading
  };

  console.log('[AuthContext] Providing context with:', {
    hasUser: !!user,
    userEmail: user?.email,
    isLoading: loading
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 
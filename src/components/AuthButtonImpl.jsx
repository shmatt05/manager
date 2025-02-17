import { useAuth } from '../contexts/AuthContext';

const AuthButtonImpl = () => {
  const { user, signIn, signOut } = useAuth();

  console.log('[AuthButtonImpl] Component mounted');
  console.log('[AuthButtonImpl] Auth state:', {
    hasUser: !!user,
    userEmail: user?.email,
    hasSignIn: typeof signIn === 'function',
    hasSignOut: typeof signOut === 'function',
  });

  if (!signIn || !signOut) {
    console.log('[AuthButtonImpl] Missing auth methods');
    return null;
  }

  const handleSignIn = async () => {
    console.log('[AuthButtonImpl] Attempting sign in');
    try {
      await signIn();
      console.log('[AuthButtonImpl] Sign in successful');
    } catch (error) {
      console.error('[AuthButtonImpl] Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('[AuthButtonImpl] Attempting sign out');
    try {
      await signOut();
      console.log('[AuthButtonImpl] Sign out successful');
    } catch (error) {
      console.error('[AuthButtonImpl] Sign out error:', error);
    }
  };

  return user ? (
    <button onClick={handleSignOut}>
      Sign Out ({user.email})
    </button>
  ) : (
    <button onClick={handleSignIn}>
      Sign In
    </button>
  );
};

export default AuthButtonImpl; 